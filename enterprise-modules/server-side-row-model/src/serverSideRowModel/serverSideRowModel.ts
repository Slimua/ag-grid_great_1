import {
    _,
    Autowired,
    Bean,
    BeanStub,
    Column,
    ColumnApi,
    ColumnController,
    ColumnVO,
    Constants,
    Events,
    FilterManager,
    GridApi,
    GridOptionsWrapper,
    IServerSideDatasource,
    IServerSideRowModel,
    Logger,
    LoggerFactory,
    ModelUpdatedEvent,
    NumberSequence,
    PostConstruct,
    PreDestroy,
    Qualifier,
    RowBounds,
    RowDataChangedEvent,
    RowDataTransaction,
    RowNode,
    RowRenderer,
    SortController
} from "@ag-grid-community/core";
import {ServerSideCache, ServerSideCacheParams} from "./serverSideCache";
import {ServerSideSortService} from "./serverSideSortService";

@Bean('rowModel')
export class ServerSideRowModel extends BeanStub implements IServerSideRowModel {

    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('filterManager') private filterManager: FilterManager;
    @Autowired('sortController') private sortController: SortController;
    @Autowired('gridApi') private gridApi: GridApi;
    @Autowired('columnApi') private columnApi: ColumnApi;
    @Autowired('rowRenderer') private rowRenderer: RowRenderer;
    @Autowired('serverSideSortService') private serverSideSortService: ServerSideSortService;

    private rootNode: RowNode;
    private datasource: IServerSideDatasource | undefined;

    private cacheParams: ServerSideCacheParams;

    private logger: Logger;    

    // we don't implement as lazy row heights is not supported in this row model
    public ensureRowHeightsValid(): boolean { return false; }

    @PostConstruct
    private postConstruct(): void {
        this.addEventListeners();
    }

    public start(): void {
        const datasource = this.gridOptionsWrapper.getServerSideDatasource();

        if (datasource) {
            this.setDatasource(datasource!);
        }
    }

    @PreDestroy
    private destroyDatasource(): void {
        if (!this.datasource) { return; }

        if (this.datasource.destroy) {
            this.datasource.destroy();
        }

        this.rowRenderer.datasourceChanged();
        this.datasource = undefined;
    }

    private setBeans(@Qualifier('loggerFactory') loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.create('ServerSideRowModel');
    }

    public applyTransaction(rowDataTransaction: RowDataTransaction, route: string[]): void {
        this.executeOnCache( route, cache => {
            cache.applyTransaction(rowDataTransaction);
        });
    }

    private addEventListeners(): void {
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, this.onColumnRowGroupChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_MODE_CHANGED, this.onPivotModeChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_EVERYTHING_CHANGED, this.onColumnEverything.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_CACHE_UPDATED, this.onCacheUpdated.bind(this));

        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VALUE_CHANGED, this.onValueChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_CHANGED, this.onColumnPivotChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_FILTER_CHANGED, this.onFilterChanged.bind(this));
    }

    public setDatasource(datasource: IServerSideDatasource): void {
        this.destroyDatasource();
        this.datasource = datasource;
        this.reset();
    }

    public isLastRowIndexKnown(): boolean {
        const cache = this.getRootCache();
        if (!cache) { return false; }
        return cache.isLastRowIndexKnown();
    }

    private onColumnEverything(): void {
        // this is a hack for one customer only, so they can suppress the resetting of the columns.
        // The problem the customer had was they were api.setColumnDefs() after the data source came
        // back with data. So this stops the reload from the grid after the data comes back.
        // Once we have "AG-1591 Allow delta changes to columns" fixed, then this hack can be taken out.
        if (this.gridOptionsWrapper.isSuppressEnterpriseResetOnNewColumns()) {
            return;
        }
        // every other customer can continue as normal and have it working!!!

        if (!this.cacheParams) {
            this.reset();
            return;
        }

        // check if anything pertaining to fetching data has changed, and if it has, reset, but if
        // it has not, don't reset
        const rowGroupColumnVos = this.columnsToValueObjects(this.columnController.getRowGroupColumns());
        const valueColumnVos = this.columnsToValueObjects(this.columnController.getValueColumns());
        const pivotColumnVos = this.columnsToValueObjects(this.columnController.getPivotColumns());

        const sortModelDifferent = !_.jsonEquals(this.cacheParams.sortModel, this.sortController.getSortModel());
        const rowGroupDifferent = !_.jsonEquals(this.cacheParams.rowGroupCols, rowGroupColumnVos);
        const pivotDifferent = !_.jsonEquals(this.cacheParams.pivotCols, pivotColumnVos);
        const valuesDifferent = !_.jsonEquals(this.cacheParams.valueCols, valueColumnVos);

        const resetRequired = sortModelDifferent || rowGroupDifferent || pivotDifferent || valuesDifferent;

        if (resetRequired) {
            this.reset();
        }
    }

    private onFilterChanged(): void {
        this.reset();
    }

    private onValueChanged(): void {
        this.reset();
    }

    private onColumnRowGroupChanged(): void {
        this.reset();
    }

    private onColumnPivotChanged(): void {
        this.reset();
    }

    private onPivotModeChanged(): void {
        this.reset();
    }

    @PreDestroy
    private destroyCache(): void {
        if (!this.rootNode || !this.rootNode.childrenCache) { return; }
        this.rootNode.childrenCache = this.destroyBean(this.rootNode.childrenCache);
    }

    public reset(): void {
        this.destroyCache();

        this.rootNode = new RowNode();
        this.rootNode.group = true;
        this.rootNode.level = -1;
        this.createBean(this.rootNode);

        if (this.datasource) {
            this.cacheParams = this.createCacheParams();
            this.rootNode.childrenCache = this.context.createBean(new ServerSideCache(this.cacheParams, this.rootNode));
            this.updateRowIndexesAndBounds();
        }

        // this event: 1) clears selection 2) updates filters 3) shows/hides 'no rows' overlay
        const rowDataChangedEvent: RowDataChangedEvent = {
            type: Events.EVENT_ROW_DATA_CHANGED,
            api: this.gridApi,
            columnApi: this.columnApi
        };
        this.eventService.dispatchEvent(rowDataChangedEvent);

        // this gets the row to render rows (or remove the previously rendered rows, as it's blank to start).
        // important to NOT pass in an event with keepRenderedRows or animate, as we want the renderer
        // to treat the rows as new rows, as it's all new data
        this.dispatchModelUpdated(true);
    }

    public columnsToValueObjects(columns: Column[]): ColumnVO[] {
        return columns.map(col => ({
            id: col.getId(),
            aggFunc: col.getAggFunc(),
            displayName: this.columnController.getDisplayNameForColumn(col, 'model'),
            field: col.getColDef().field
        }) as ColumnVO);
    }

    private createCacheParams(): ServerSideCacheParams {

        const rowGroupColumnVos = this.columnsToValueObjects(this.columnController.getRowGroupColumns());
        const valueColumnVos = this.columnsToValueObjects(this.columnController.getValueColumns());
        const pivotColumnVos = this.columnsToValueObjects(this.columnController.getPivotColumns());

        const dynamicRowHeight = this.gridOptionsWrapper.isDynamicRowHeight();
        let maxBlocksInCache = this.gridOptionsWrapper.getMaxBlocksInCache();

        if (dynamicRowHeight && maxBlocksInCache as number >= 0) {
            console.warn('ag-Grid: Server Side Row Model does not support Dynamic Row Height and Cache Purging. ' +
                'Either a) remove getRowHeight() callback or b) remove maxBlocksInCache property. Purging has been disabled.');
            maxBlocksInCache = undefined;
        }

        if (maxBlocksInCache as number >= 0 && this.columnController.isAutoRowHeightActive()) {
            console.warn('ag-Grid: Server Side Row Model does not support Auto Row Height and Cache Purging. ' +
                'Either a) remove colDef.autoHeight or b) remove maxBlocksInCache property. Purging has been disabled.');
            maxBlocksInCache = undefined;
        }

        const userProvidedBlockSize = this.gridOptionsWrapper.getCacheBlockSize();

        let blockSize: number;
        if (typeof userProvidedBlockSize == 'number' && userProvidedBlockSize > 0) {
            blockSize = userProvidedBlockSize;
        } else {
            blockSize = ServerSideBlock.DefaultBlockSize;
        }

        const params: ServerSideCacheParams = {
            // the columns the user has grouped and aggregated by
            valueCols: valueColumnVos,
            rowGroupCols: rowGroupColumnVos,
            pivotCols: pivotColumnVos,
            pivotMode: this.columnController.isPivotMode(),

            // sort and filter model
            filterModel: this.filterManager.getFilterModel(),
            sortModel: this.serverSideSortService.extractSortModel(),

            datasource: this.datasource,
            lastAccessedSequence: new NumberSequence(),
            maxBlocksInCache: maxBlocksInCache,
            blockSize: blockSize,
            dynamicRowHeight: dynamicRowHeight
        };

        return params;
    }

    public getParams(): ServerSideCacheParams {
        return this.cacheParams;
    }

    private dispatchModelUpdated(reset = false): void {
        const modelUpdatedEvent: ModelUpdatedEvent = {
            type: Events.EVENT_MODEL_UPDATED,
            api: this.gridApi,
            columnApi: this.columnApi,
            animate: !reset,
            keepRenderedRows: !reset,
            newPage: false,
            newData: false
        };
        this.eventService.dispatchEvent(modelUpdatedEvent);
    }

    private onCacheUpdated(): void {
        this.updateRowIndexesAndBounds();
        this.dispatchModelUpdated();
    }

    public onRowHeightChanged(): void {
        this.updateRowIndexesAndBounds();
        this.dispatchModelUpdated();
    }

    public updateRowIndexesAndBounds(): void {
        const cache = this.getRootCache();
        if (!cache) { return; }

        cache.forEachNodeDeep(rowNode => rowNode.clearRowTop(), new NumberSequence());
        cache.setDisplayIndexes(new NumberSequence(), {value: 0});
    }

    public getRow(index: number): RowNode | null {
        const cache = this.getRootCache();
        if (!cache) { return null; }
        return cache.getRowUsingDisplayIndex(index);
    }

    public updateSortModel(newSortModel: any): void {
        this.cacheParams.sortModel = newSortModel;
    }

    public getRootCache(): ServerSideCache {
        if (this.rootNode && this.rootNode.childrenCache) {
            return (this.rootNode.childrenCache as ServerSideCache);
        } else {
            return undefined;
        }
    }

    public getRowCount(): number {
        const cache = this.getRootCache();
        if (!cache) { return 1; }
        return cache.getDisplayIndexEnd();
    }

    public getTopLevelRowCount(): number {
        const cache = this.getRootCache();
        if (!cache) { return 1; }
        return cache.getRowCount();
    }

    public getTopLevelRowDisplayedIndex(topLevelIndex: number): number {
        const cache = this.getRootCache();
        if (!cache) { return topLevelIndex; }
        return cache.getTopLevelRowDisplayedIndex(topLevelIndex);
    }

    public getRowBounds(index: number): RowBounds {
        const cache = this.getRootCache();
        if (!cache) {
            const rowHeight = this.gridOptionsWrapper.getRowHeightAsNumber();
            return {
                rowTop: 0,
                rowHeight: rowHeight
            };
        }
        return cache.getRowBounds(index);
    }

    public getRowIndexAtPixel(pixel: number): number {
        const cache = this.getRootCache();
        if (pixel===0 || !cache) { return 0; }
        return cache.getRowIndexAtPixel(pixel);
    }

    public isEmpty(): boolean {
        return false;
    }

    public isRowsToRender(): boolean {
        return this.getRootCache()!=null && this.getRowCount() > 0;
    }

    public getType(): string {
        return Constants.ROW_MODEL_TYPE_SERVER_SIDE;
    }

    public forEachNode(callback: (rowNode: RowNode, index: number) => void): void {
        const cache = this.getRootCache();
        if (!cache) { return; }
        cache.forEachNodeDeep(callback);
    }

    private executeOnCache(route: string[], callback: (cache: ServerSideCache) => void) {
        const cache = this.getRootCache();
        if (!cache) { return; }

        const cacheToPurge = cache.getChildCache(route);

        if (cacheToPurge) {
            callback(cacheToPurge);
        }
    }

    public purgeCache(route: string[] = []): void {
        this.executeOnCache(route, cache => cache.purgeCache());
    }

    public getNodesInRangeForSelection(firstInRange: RowNode, lastInRange: RowNode): RowNode[] {
        if (_.exists(lastInRange) && firstInRange.parent !== lastInRange.parent) {
            return [];
        }
        return (firstInRange.parent!.childrenCache as ServerSideCache)!.getRowNodesInRange(lastInRange, firstInRange);
    }

    public getRowNode(id: string): RowNode | null {
        let result: RowNode | null = null;
        this.forEachNode(rowNode => {
            if (rowNode.id === id) {
                result = rowNode;
            }
            if (rowNode.detailNode && rowNode.detailNode.id === id) {
                result = rowNode.detailNode;
            }
        });
        return result;
    }

    // always returns true - this is used by the
    public isRowPresent(rowNode: RowNode): boolean {
        const foundRowNode = this.getRowNode(rowNode.id);
        return !!foundRowNode;
    }
}
