import {
    Autowired,
    Bean,
    BeanStub,
    Column,
    ColumnModel,
    Events,
    PostConstruct,
    RowNode,
    RowPositionUtils,
    ValueService
} from "@ag-grid-community/core";

@Bean("chartColumnService")
export class ChartColumnService extends BeanStub {
    
    @Autowired('valueService') private readonly valueService: ValueService;
    @Autowired('rowPositionUtils') private rowPositionUtils: RowPositionUtils;

    private valueColsWithoutSeriesType: Set<string> = new Set();

    @PostConstruct
    private postConstruct(): void {
        const clearValueCols = () => this.valueColsWithoutSeriesType.clear();
        this.addManagedEventListener(Events.EVENT_NEW_COLUMNS_LOADED, clearValueCols);
        this.addManagedEventListener(Events.EVENT_ROW_DATA_UPDATED, clearValueCols);
    }

    public getColumn(colId: string): Column | null {
        return this.beans.columnModel.getPrimaryColumn(colId);
    }

    public getAllDisplayedColumns(): Column[] {
        return this.beans.columnModel.getAllDisplayedColumns();
    }

    public getColDisplayName(col: Column): string | null {
        return this.beans.columnModel.getDisplayNameForColumn(col, 'chart');
    }

    public getRowGroupColumns(): Column[] {
        return this.beans.columnModel.getRowGroupColumns();
    }

    public getGroupDisplayColumns(): Column[] {
        return this.beans.columnModel.getGroupDisplayColumns();
    }

    public isPivotMode(): boolean {
        return this.beans.columnModel.isPivotMode();
    }

    public isPivotActive(): boolean {
        return this.beans.columnModel.isPivotActive();
    }

    public getChartColumns(): { dimensionCols: Set<Column>; valueCols: Set<Column>; } {
        const gridCols = this.beans.columnModel.getAllGridColumns();

        const dimensionCols = new Set<Column>();
        const valueCols = new Set<Column>();

        gridCols.forEach(col => {
            const colDef = col.getColDef();
            const chartDataType = colDef.chartDataType;

            if (chartDataType) {
                // chart data type was specified explicitly
                switch (chartDataType) {
                    case 'category':
                    case 'time':
                        dimensionCols.add(col);
                        return;
                    case 'series':
                        valueCols.add(col);
                        return;
                    case 'excluded':
                        return;
                    default:
                        console.warn(`AG Grid: unexpected chartDataType value '${chartDataType}' supplied, instead use 'category', 'series' or 'excluded'`);
                        break;
                }
            }

            if (colDef.colId === 'ag-Grid-AutoColumn') {
                dimensionCols.add(col);
                return;
            }

            if (!col.isPrimary()) {
                valueCols.add(col);
                return;
            }

            // if 'chartDataType' is not provided then infer type based data contained in first row
            (this.isInferredValueCol(col) ? valueCols : dimensionCols).add(col);
        });

        return { dimensionCols, valueCols };
    }

    private isInferredValueCol(col: Column): boolean {
        const colId = col.getColId();
        if (colId === 'ag-Grid-AutoColumn') {
            return false;
        }

        const row = this.rowPositionUtils.getRowNode({ rowIndex: 0, rowPinned: null });

        if (!row) {
            return this.valueColsWithoutSeriesType.has(colId);
        }

        let cellValue = this.valueService.getValue(col, row);

        if (cellValue == null) {
            cellValue = this.extractLeafData(row, col);
        }

        if (cellValue != null && typeof cellValue.toNumber === 'function') {
            cellValue = cellValue.toNumber();
        }

        const isNumber = typeof cellValue === 'number';

        if (isNumber) {
            this.valueColsWithoutSeriesType.add(colId);
        }

        return isNumber;
    }

    private extractLeafData(row: RowNode, col: Column): any {
        if (!row.allLeafChildren) { return null; }

        for (let i = 0; i < row.allLeafChildren.length; i++) {
            const childRow = row.allLeafChildren[i];
            const value = this.valueService.getValue(col, childRow);

            if (value != null) {
                return value;
            }
        }

        return null;
    }

    protected destroy(): void {
        this.valueColsWithoutSeriesType.clear();
        super.destroy();
    }
}
