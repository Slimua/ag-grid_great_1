import {
    _,
    Autowired,
    BeanStub,
    CellRange,
    CellRangeType,
    ChartType,
    Column,
    ColumnController,
    GridOptionsWrapper,
    IAggFunc,
    PostConstruct,
    RowNode,
    RowRenderer,
    IRangeController
} from "@ag-grid-community/core";
import { ChartDatasource, ChartDatasourceParams } from "./chartDatasource";
import { Palette } from "../../charts/chart/palettes";
import { ChartProxy } from "./chartProxies/chartProxy";

export interface ColState {
    column?: Column;
    colId: string;
    displayName: string;
    selected: boolean;
}

export interface ChartModelParams {
    pivotChart: boolean;
    chartType: ChartType;
    aggFunc?: string | IAggFunc;
    cellRanges: CellRange[];
    palettes: Palette[];
    activePalette: number;
    suppressChartRanges: boolean;
}

export class ChartModel extends BeanStub {

    public static DEFAULT_CATEGORY = 'AG-GRID-DEFAULT-CATEGORY';

    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('rangeController') rangeController: IRangeController;
    @Autowired('rowRenderer') private rowRenderer: RowRenderer;

    // model state
    private cellRanges: CellRange[];
    private referenceCellRange: CellRange;
    private dimensionColState: ColState[] = [];
    private valueColState: ColState[] = [];
    private chartData: any[];

    private readonly pivotChart: boolean;
    private chartType: ChartType;
    private activePalette: number;
    private readonly palettes: Palette[];
    private readonly suppressChartRanges: boolean;

    private readonly aggFunc?: string | IAggFunc;

    private initialising = true;

    private datasource: ChartDatasource;

    private readonly chartId: string;
    private chartProxy: ChartProxy<any, any>;
    private detached: boolean = false;
    private grouping: boolean;
    private columnNames: { [p: string]: string[] } = {};

    public constructor(params: ChartModelParams) {
        super();

        this.pivotChart = params.pivotChart;
        this.chartType = params.chartType;
        this.aggFunc = params.aggFunc;
        this.cellRanges = params.cellRanges;
        this.palettes = params.palettes;
        this.activePalette = params.activePalette;
        this.suppressChartRanges = params.suppressChartRanges;

        // this is used to associate chart ranges with charts
        this.chartId = this.generateId();
    }

    @PostConstruct
    private init(): void {
        this.datasource = this.wireBean(new ChartDatasource());

        // use first range as a reference range to be used after removing all cols (via menu) so we can re-add later
        this.referenceCellRange = this.cellRanges[0];
    }

    public updateData(): void {
        const { startRow, endRow } = this.getRowIndexes();
        const selectedDimension = this.getSelectedDimension();
        const selectedValueCols = this.getSelectedValueCols();

        this.grouping = this.isGrouping();

        const params: ChartDatasourceParams = {
            aggFunc: this.aggFunc,
            dimensionCols: [selectedDimension],
            grouping: this.grouping,
            pivoting: this.isPivotActive(),
            multiCategories: this.isMultiCategoryChart(),
            valueCols: selectedValueCols,
            startRow,
            endRow
        };

        const result = this.datasource.getData(params);

        this.chartData = result.data;
        this.columnNames = result.columnNames;
    }

    public resetColumnState(): void {
        const { dimensionCols, valueCols } = this.getAllChartColumns();
        const allCols = this.pivotChart ? this.columnController.getAllDisplayedColumns() : this.getAllColumnsFromRanges();

        this.valueColState = valueCols.map(column => {
            return {
                column,
                colId: column.getColId(),
                displayName: this.getColDisplayName(column),
                selected: allCols.indexOf(column) > -1
            };
        });

        this.dimensionColState = dimensionCols.map(column => {
            return {
                column,
                colId: column.getColId(),
                displayName: this.getColDisplayName(column),
                selected: false
            };
        });

        const dimensionsInCellRange = dimensionCols.filter(col => allCols.indexOf(col) > -1);

        if (dimensionsInCellRange.length > 0) {
            // select the first dimension from the range
            const selectedDimensionId = dimensionsInCellRange[0].getColId();
            this.dimensionColState.forEach(cs => cs.selected = cs.colId === selectedDimensionId);
        }

        // if no dimensions in range select the default
        const defaultCategory = {
            colId: ChartModel.DEFAULT_CATEGORY,
            displayName: '(None)',
            selected: dimensionsInCellRange.length === 0
        };

        this.dimensionColState.unshift(defaultCategory);
    }

    public updateColumnState(updatedCol: ColState) {
        const idsMatch = (cs: ColState) => cs.colId === updatedCol.colId;
        const isDimensionCol = this.dimensionColState.filter(idsMatch).length > 0;
        const isValueCol = this.valueColState.filter(idsMatch).length > 0;

        if (isDimensionCol) {
            // only one dimension should be selected
            this.dimensionColState.forEach(cs => cs.selected = idsMatch(cs));

        } else if (isValueCol) {
            // just update the selected value on the supplied value column
            this.valueColState.forEach(cs => cs.selected = idsMatch(cs) ? updatedCol.selected : cs.selected);
        }
    }

    public updateCellRanges(updatedCol?: ColState) {
        const { dimensionCols, valueCols } = this.getAllChartColumns();
        const lastRange = _.last(this.cellRanges) as CellRange;
        if (lastRange) {
            // update the reference range
            this.referenceCellRange = lastRange;

            if (updatedCol) {
                const updatingStartCol = lastRange.columns[0] === updatedCol.column;
                this.referenceCellRange.startColumn = updatingStartCol ? lastRange.columns[1] : lastRange.columns[0];
            }
        }

        const allColsFromRanges = this.getAllColumnsFromRanges();

        // clear ranges
        this.cellRanges = [];

        const dimensionColsInRange = dimensionCols.filter(col => allColsFromRanges.indexOf(col) > -1);
        if (this.initialising) {
            // first time in just take the first dimension from the range as the column state hasn't been updated yet
            if (dimensionColsInRange.length > 0) {
                this.addRange(CellRangeType.DIMENSION, [dimensionColsInRange[0]]);
            }
            this.initialising = false;
        }

        if (updatedCol && dimensionCols.indexOf(updatedCol.column as Column) > -1) {
            // if updated col is dimension col and is not the default category
            if (updatedCol!.colId !== ChartModel.DEFAULT_CATEGORY) {
                this.addRange(CellRangeType.DIMENSION, [updatedCol!.column as Column]);
            }
        } else {
            // otherwise use current selected dimension
            const selectedDimension = this.dimensionColState.filter(cs => cs.selected)[0];
            if (selectedDimension && selectedDimension.colId !== ChartModel.DEFAULT_CATEGORY) {
                this.addRange(CellRangeType.DIMENSION, [selectedDimension.column!]);
            }
        }

        let valueColsInRange = valueCols.filter(col => _.includes(allColsFromRanges, col));

        if (updatedCol && _.includes(valueCols, updatedCol.column!)) {
            if (updatedCol.selected) {
                valueColsInRange.push(updatedCol.column);
                valueColsInRange = this.getColumnInDisplayOrder(valueCols, valueColsInRange);
            } else {
                valueColsInRange = valueColsInRange.filter(col => col.getColId() !== updatedCol.colId);
            }
        }

        if (valueColsInRange.length > 0) {
            this.addRange(CellRangeType.VALUE, valueColsInRange);
        }
    }

    public getData(): any[] {
        // grouped data contains label fields rather than objects with toString
        if (this.grouping && this.isMultiCategoryChart()) {
            return this.chartData;
        }

        const colId = this.getSelectedDimension().colId;

        // replacing the selected dimension with a complex object to facilitate duplicated categories
        return this.chartData.map((d: any, index: number) => {
            const value = d[colId];
            const valueString = value && value.toString ? value.toString() : '';

            d[colId] = { id: index, value: d[colId], toString: () => valueString };

            return d;
        });
    }

    public setChartType(chartType: ChartType) {
        const isCurrentMultiCategory = this.isMultiCategoryChart();

        this.chartType = chartType;

        // switching between single and multi-category charts requires data to be reformatted
        if (isCurrentMultiCategory !== this.isMultiCategoryChart()) {
            this.updateData();
        }
    }

    public isGrouping(): boolean {
        const usingTreeData = this.gridOptionsWrapper.isTreeData();
        const groupedCols = usingTreeData ? null : this.columnController.getRowGroupColumns();
        const groupActive = usingTreeData || (groupedCols && groupedCols.length > 0) as boolean;

        // charts only group when the selected category is a group column
        const groupCols = this.columnController.getGroupDisplayColumns();
        const colId = this.getSelectedDimension().colId;
        const groupDimensionSelected = groupCols
            .map(col => col.getColId())
            .some(id => id === colId);

        return groupActive && groupDimensionSelected;
    }

    public isPivotActive = (): boolean => this.columnController.isPivotActive();

    public isPivotMode = (): boolean => this.columnController.isPivotMode();

    public isPivotChart = (): boolean => this.pivotChart;

    public setChartProxy(chartProxy: ChartProxy<any, any>): void {
        this.chartProxy = chartProxy;
    }

    public getChartProxy = (): ChartProxy<any, any> => this.chartProxy;

    public getChartId = (): string => this.chartId;

    public getValueColState = (): ColState[] => this.valueColState.map(this.displayNameMapper.bind(this));

    public getDimensionColState = (): ColState[] => this.dimensionColState;

    public getCellRanges = (): CellRange[] => this.cellRanges;

    public getChartType = (): ChartType => this.chartType;

    public setActivePalette(palette: number) {
        this.activePalette = palette;
    }

    public getActivePalette = (): number => this.activePalette;

    public getPalettes = (): Palette[] => this.palettes;

    public isSuppressChartRanges = (): boolean => this.suppressChartRanges;

    public isDetached = (): boolean => this.detached;

    public toggleDetached(): void {
        this.detached = !this.detached;
    }

    public getSelectedValueColState = (): { colId: string, displayName: string }[] => this.getValueColState().filter(cs => cs.selected);

    public getSelectedValueCols = (): Column[] => this.valueColState.filter(cs => cs.selected).map(cs => cs.column!);

    public getSelectedDimension = (): ColState => this.dimensionColState.filter(cs => cs.selected)[0];

    private getColumnInDisplayOrder(allDisplayedColumns: Column[], listToSort: Column[]): Column[] {
        return allDisplayedColumns.filter(col => _.includes(listToSort, col));
    }

    private addRange(cellRangeType: CellRangeType, columns: Column[]) {
        const newRange = {
            id: this.chartId,
            startRow: this.referenceCellRange.startRow,
            endRow: this.referenceCellRange.endRow,
            columns: columns,
            startColumn: this.referenceCellRange.startColumn,
            type: cellRangeType
        };

        cellRangeType === CellRangeType.DIMENSION ? this.cellRanges.unshift(newRange) : this.cellRanges.push(newRange);
    }

    private getAllColumnsFromRanges = (): Column[] => _.flatten(this.cellRanges.map(range => range.columns));

    private getColDisplayName = (col: Column): string => this.columnController.getDisplayNameForColumn(col, 'chart')!;

    private getRowIndexes(): { startRow: number, endRow: number } {
        let startRow = 0, endRow = 0;
        const range = _.last(this.cellRanges) as CellRange;

        if (this.rangeController && range) {
            startRow = this.rangeController.getRangeStartRow(range).rowIndex;
            endRow = this.rangeController.getRangeEndRow(range).rowIndex;
        }

        return { startRow, endRow };
    }

    private getAllChartColumns(): { dimensionCols: Column[], valueCols: Column[] } {
        const displayedCols = this.columnController.getAllDisplayedColumns();
        const dimensionCols: Column[] = [];
        const valueCols: Column[] = [];

        displayedCols.forEach(col => {
            const colDef = col.getColDef();

            const chartDataType = colDef.chartDataType;

            if (chartDataType) {
                // chart data type was specified explicitly
                switch (chartDataType) {
                    case 'category':
                        dimensionCols.push(col);
                        return;
                    case 'series':
                        valueCols.push(col);
                        return;
                    case 'excluded':
                        return;
                    default:
                        console.warn(`ag-Grid: unexpected chartDataType value '${chartDataType}' supplied, instead use 'category', 'series' or 'excluded'`);
                        break;
                }
            }

            if (colDef.colId === 'ag-Grid-AutoColumn') {
                dimensionCols.push(col);
                return;
            }

            if (!col.isPrimary()) {
                valueCols.push(col);
                return;
            }

            // if 'chartDataType' is not provided then infer type based data contained in first row
            this.isNumberCol(col.getColId()) ? valueCols.push(col) : dimensionCols.push(col);
        });

        return { dimensionCols, valueCols };
    }

    private isNumberCol(colId: any) {
        if (colId === 'ag-Grid-AutoColumn') { return false; }

        const row = this.rowRenderer.getRowNode({ rowIndex: 0, rowPinned: undefined });

        if (!row) { return false; }

        let cellData;

        if (row.group) {
            cellData = this.extractAggregateValue(row, colId) || this.extractLeafData(row, colId);
        } else {
            const rowData = row.data;
            cellData = rowData ? rowData[colId] : null;
        }

        return typeof cellData === 'number';
    }

    private extractAggregateValue(row: RowNode, colId: any) {
        if (!row.aggData) { return null; }

        const aggDatum = row.aggData[colId];

        if (!aggDatum) { return null; }

        return typeof aggDatum.toNumber === 'function' ? aggDatum.toNumber() : aggDatum;
    }

    private extractLeafData(row: RowNode, colId: any) {
        const cellData = row.allLeafChildren.map(child => child.data).map(data => data[colId]);

        for (let i = 0; i < cellData.length; i++) {
            if (cellData[i] !== null) {
                return cellData[i];
            }
        }

        return null;
    }

    private displayNameMapper(col: ColState) {
        if (this.columnNames[col.colId]) {
            col.displayName = this.columnNames[col.colId].join(' - ');
        } else {
            col.displayName = this.getColDisplayName(col.column as Column);
        }
        return col;
    }

    private isMultiCategoryChart = (): boolean => !_.includes([ChartType.Pie, ChartType.Doughnut, ChartType.Scatter, ChartType.Bubble], this.chartType);

    private generateId = (): string => 'id-' + Math.random().toString(36).substr(2, 16);

    public destroy() {
        super.destroy();

        if (this.datasource) {
            this.datasource.destroy();
        }
    }
}
