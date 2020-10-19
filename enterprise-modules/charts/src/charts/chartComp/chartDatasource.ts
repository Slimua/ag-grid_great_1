import {
    _,
    Autowired,
    BeanStub,
    Column,
    ColumnController, ColumnGroup, GridOptionsWrapper,
    IAggFunc,
    IAggregationStage,
    IRowModel,
    ModuleNames,
    ModuleRegistry,
    Optional,
    RowNode,
    ValueService
} from "@ag-grid-community/core";
import {ChartDataModel, ColState} from "./chartDataModel";

export interface ChartDatasourceParams {
    dimensionCols: ColState[];
    grouping: boolean;
    pivoting: boolean;
    valueCols: Column[];
    startRow: number;
    endRow: number;
    aggFunc?: string | IAggFunc;
}

interface IData {
    data: any[];
    columnNames: { [key: string]: string[]; };
}

export class ChartDatasource extends BeanStub {
    @Autowired('rowModel') private readonly gridRowModel: IRowModel;
    @Autowired('valueService') private readonly valueService: ValueService;
    @Autowired('columnController') private readonly columnController: ColumnController;
    @Autowired('gridOptionsWrapper') private readonly gridOptionsWrapper: GridOptionsWrapper;
    @Optional('aggregationStage') private readonly aggregationStage: IAggregationStage;

    public getData(params: ChartDatasourceParams): IData {
        const isServerSide = this.gridOptionsWrapper.isRowModelServerSide();
        if (isServerSide && params.pivoting) {
            this.updatePivotKeysForSSRM();
        }

        const result = this.extractRowsFromGridRowModel(params);
        result.data = this.aggregateRowsByDimension(params, result.data);
        return result;
    }

    private extractRowsFromGridRowModel(params: ChartDatasourceParams): IData {
        let extractedRowData = [];
        const columnNames: { [key: string]: string[]; } = {};

        // maps used to keep track of expanded groups that need to be removed
        const groupNodeIndexes: { [key: string]: number; } = {};
        const groupsToRemove: { [key: string]: number; } = {};

        // make sure enough rows in range to chart. if user filters and less rows, then end row will be
        // the last displayed row, not where the range ends.
        const modelLastRow = this.gridRowModel.getRowCount() - 1;
        const rangeLastRow = params.endRow >= 0 ? Math.min(params.endRow, modelLastRow) : modelLastRow;
        const numRows = rangeLastRow - params.startRow + 1;

        for (let i = 0; i < numRows; i++) {
            const data: any = {};
            const rowNode = this.gridRowModel.getRow(i + params.startRow)!;

            // first get data for dimensions columns
            params.dimensionCols.forEach(col => {
                const colId = col.colId;
                const column = this.columnController.getGridColumn(colId);

                if (column) {
                    const valueObject = this.valueService.getValue(column, rowNode);

                    // when grouping we also need to build up multi category labels for charts
                    if (params.grouping) {
                        const valueString = valueObject && valueObject.toString ? String(valueObject.toString()) : '';

                        // traverse parents to extract group label path
                        const labels = ChartDatasource.getGroupLabels(rowNode, valueString);

                        data[colId] = {
                            labels, toString: function() {
                                return this.labels.filter((l: string) => !!l).reverse().join(' - ');
                            }
                        };

                        // keep track of group node indexes so they can be padded when other groups are expanded
                        if (rowNode.group) {
                            groupNodeIndexes[labels.toString()] = i;
                        }

                        // if node (group or leaf) has parents then it is expanded and should be removed
                        const groupKey = labels.slice(1, labels.length).toString();

                        if (groupKey) {
                            groupsToRemove[groupKey] = groupNodeIndexes[groupKey];
                        }
                    } else {
                        // leaf nodes can be directly added to dimension columns
                        data[colId] = valueObject;
                    }
                } else {
                    // introduce a default category when no dimensions exist with a value based off row index (+1)
                    data[ChartDataModel.DEFAULT_CATEGORY] = i + 1;
                }
            });

            // then get data for value columns
            params.valueCols.forEach(col => {
                let columnNamesArr: string[] = [];

                // pivot keys should be added first
                const pivotKeys = col.getColDef().pivotKeys;
                if (pivotKeys) {
                    columnNamesArr = pivotKeys.slice();
                }

                // then add column header name to results
                const headerName = col.getColDef().headerName;
                if (headerName) {
                    columnNamesArr.push(headerName);
                }

                // add array of column names to results
                if (columnNamesArr.length > 0) {
                    columnNames[col.getId()] = columnNamesArr;
                }

                // add data value to value column
                const value = this.valueService.getValue(col, rowNode);

                data[col.getId()] = value != null && typeof value.toNumber === 'function' ? value.toNumber() : value;
            });

            // add data to results
            extractedRowData.push(data);
        }

        if (params.grouping) {
            const groupIndexesToRemove = _.values(groupsToRemove);
            extractedRowData = extractedRowData.filter((_1, index) => !_.includes(groupIndexesToRemove, index));
        }

        return { data: extractedRowData, columnNames };
    }

    private aggregateRowsByDimension(params: ChartDatasourceParams, dataFromGrid: any[]): any[] {
        const dimensionCols = params.dimensionCols;

        if (!params.aggFunc || dimensionCols.length === 0) { return dataFromGrid; }

        const lastCol = _.last(dimensionCols);
        const lastColId = lastCol && lastCol.colId;
        const map: any = {};
        const dataAggregated: any[] = [];

        dataFromGrid.forEach(data => {
            let currentMap = map;

            dimensionCols.forEach(col => {
                const colId = col.colId;
                const key = data[colId];

                if (colId === lastColId) {
                    let groupItem = currentMap[key];

                    if (!groupItem) {
                        groupItem = { __children: [] };

                        dimensionCols.forEach(dimCol => {
                            const dimColId = dimCol.colId;
                            groupItem[dimColId] = data[dimColId];
                        });

                        currentMap[key] = groupItem;
                        dataAggregated.push(groupItem);
                    }

                    groupItem.__children.push(data);
                } else {
                    // map of maps
                    if (!currentMap[key]) {
                        currentMap[key] = {};
                    }

                    currentMap = currentMap[key];
                }
            });
        });

        dataAggregated.forEach(groupItem => params.valueCols.forEach(col => {
            const dataToAgg = groupItem.__children.map((child: any) => child[col.getId()]);
            let aggResult: any = 0;

            if (ModuleRegistry.assertRegistered(ModuleNames.RowGroupingModule, 'Charting Aggregation')) {
                aggResult = this.aggregationStage.aggregateValues(dataToAgg, params.aggFunc);
            }

            groupItem[col.getId()] = aggResult && typeof aggResult.value !== 'undefined' ? aggResult.value : aggResult;
        }));

        return dataAggregated;
    }

    private updatePivotKeysForSSRM() {
        const secondaryColumns = this.columnController.getSecondaryColumns();

        if (!secondaryColumns) { return; }

        // we don't know what the application will use for the pivot key separator (i.e. '_' or '|' ) as the
        // secondary columns are provided to grid by the application via columnApi.setSecondaryColumns()
        const pivotKeySeparator = this.extractPivotKeySeparator(secondaryColumns);

        // 'pivotKeys' is not used by the SSRM for pivoting so it is safe to reuse this colDef property, this way
        // the same logic can be used for CSRM and SSRM to extract legend names in extractRowsFromGridRowModel()
        secondaryColumns.forEach(col => {
            const keys = col.getColId().split(pivotKeySeparator);
            col.getColDef().pivotKeys = keys.slice(0, keys.length - 1);
        });
    }

    private extractPivotKeySeparator(secondaryColumns: any) {
        if (secondaryColumns.length === 0) { return ""; }

        const extractSeparator = (columnGroup: ColumnGroup, childId: string): string => {
            const groupId = columnGroup.getGroupId();
            if (!columnGroup.getParent()) {
                // removing groupId ('2000') from childId ('2000|Swimming') yields '|Swimming' so first char is separator
                return childId.split(groupId)[1][0];
            }
            return extractSeparator(columnGroup.getParent(), groupId);
        }

        const firstSecondaryCol = secondaryColumns[0];
        return extractSeparator(firstSecondaryCol.getParent(), firstSecondaryCol.getColId());
    }

    private static getGroupLabels(rowNode: RowNode, initialLabel: string): string[] {
        const labels = [initialLabel];
        while (rowNode && rowNode.level !== 0) {
            rowNode = rowNode.parent;
            if (rowNode) {
                labels.push(rowNode.key);
            }
        }
        return labels;
    }
}
