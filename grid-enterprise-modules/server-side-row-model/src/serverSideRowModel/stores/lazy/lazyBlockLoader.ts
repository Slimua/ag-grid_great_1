import { BeanStub, Autowired, GridApi, ColumnApi, RowNode, IServerSideGetRowsParams, IServerSideGetRowsRequest, _, PostConstruct, RowNodeBlockLoader, ServerSideGroupLevelParams, LoadSuccessParams } from "@ag-grid-community/core";
import { LazyCache } from "./lazyCache";

export class LazyBlockLoader extends BeanStub {

    @Autowired('gridApi') private api: GridApi;
    @Autowired('columnApi') private columnApi: ColumnApi;
    @Autowired('rowNodeBlockLoader') private rowNodeBlockLoader: RowNodeBlockLoader;

    public static DEFAULT_BLOCK_SIZE = 100;

    private loadingNodes: Set<number> = new Set();

    private readonly parentNode: RowNode;
    private readonly cache: LazyCache;

    private loaderTimeout: number | undefined = undefined;
    private nextBlockToLoad: [string, number] | undefined = undefined;

    private storeParams: ServerSideGroupLevelParams;

    constructor(cache: LazyCache, parentNode: RowNode, storeParams: ServerSideGroupLevelParams) {
        super();
        this.parentNode = parentNode;
        this.cache = cache;
        this.storeParams = storeParams;
    }

    @PostConstruct
    private init() {
        this.addManagedListener(this.rowNodeBlockLoader, RowNodeBlockLoader.BLOCK_LOADED_EVENT, () => this.queueLoadAction());
    }

    public isRowLoading(index: number) {
        return this.loadingNodes.has(index);
    }

    private doesRowNeedLoaded(index: number) {
        // block already loading, don't duplicate request
        if(this.loadingNodes.has(index)) {
            return false;
        }
        const node = this.cache.getRowByStoreIndex(index);
        if (!node) {
            return false;
        }

        // user has manually refreshed this node
        if (node.__needsRefresh) {
            return true;
        }

        const firstRow = this.api.getFirstDisplayedRow();
        const lastRow = this.api.getLastDisplayedRow();
        const isRowInViewport = node.rowIndex != null && node.rowIndex >= firstRow && node.rowIndex <= lastRow;
        
        // other than refreshing nodes, only ever load nodes in viewport
        if (!isRowInViewport) {
            return false;
        }

        // if node is a loading stub, or if it needs reverified, we refresh
        return (node.stub && !node.failedLoad) || node.__needsRefreshWhenVisible;
    }

    private getBlocksToLoad() {
        const indexesToLoad = new Set<number>();

        // filter for nodes somewhat reasonably close to viewport, so we don't refresh all data
        // sort by distance to viewport, so user is making relevant requests
        this.cache.getNodeMapEntries().forEach(([stringIndex, node]) => {
            const numericIndex = Number(stringIndex);
            const blockStart = this.getBlockStartIndexForIndex(numericIndex);
            // if node is a loading stub, or has manually been marked as needsRefresh we refresh
            if (this.doesRowNeedLoaded(numericIndex)) {
                indexesToLoad.add(blockStart);
                return;
            }
        });
        return [...indexesToLoad];
    }

    private getNodeRanges() {
        const ranges: { [startOfRange: string]: number } = {};
        this.getBlocksToLoad().forEach(index => {
            const rangeSize = _.oneOrGreater(this.gridOptionsService.getNum('cacheBlockSize')) || LazyBlockLoader.DEFAULT_BLOCK_SIZE;
            const translatedIndex = index - (index % rangeSize);
            ranges[translatedIndex] = translatedIndex + rangeSize;
        });

        return ranges;
    }

    public reset() {
        this.loadingNodes.clear();
        clearTimeout(this.loaderTimeout);
        this.loaderTimeout = undefined;
    }

    private executeLoad(startRow: number, endRow: number) {
        const ssrmParams = this.cache.getSsrmParams();
        const request: IServerSideGetRowsRequest = {
            startRow,
            endRow,
            rowGroupCols: ssrmParams.rowGroupCols,
            valueCols: ssrmParams.valueCols,
            pivotCols: ssrmParams.pivotCols,
            pivotMode: ssrmParams.pivotMode,
            groupKeys: this.parentNode.getGroupKeys(),
            filterModel: ssrmParams.filterModel,
            sortModel: ssrmParams.sortModel,
        };

        const removeNodesFromLoadingMap = () => {
            for (let i = 0; i < endRow - startRow; i++) {
                this.loadingNodes.delete(startRow + i);
            }
        }
        
        const addNodesToLoadingMap = () => {
            for (let i = 0; i < endRow - startRow; i++) {
                this.loadingNodes.add(startRow + i);
            }
        }

        const success = (params: LoadSuccessParams) => {
            this.rowNodeBlockLoader.loadComplete();
            this.cache.onLoadSuccess(startRow, endRow - startRow, params);
            removeNodesFromLoadingMap();
            this.queueLoadAction();
        };

        const fail = () => {
            this.rowNodeBlockLoader.loadComplete();
            this.cache.onLoadFailed(startRow, endRow - startRow);
            removeNodesFromLoadingMap();
            this.queueLoadAction();
        }

        const params: IServerSideGetRowsParams = {
            request,
            successCallback: (rowData: any[], rowCount: number) => success({ rowData, rowCount }),
            success,
            failCallback: fail,
            fail,
            parentNode: this.parentNode,
            api: this.api,
            columnApi: this.columnApi,
            context: this.gridOptionsService.context
        };

        addNodesToLoadingMap();
        this.cache.getSsrmParams().datasource?.getRows(params);
    }

    private isBlockInViewport(blockStart: number, blockEnd: number) {
        const firstRowInViewport = this.api.getFirstDisplayedRow();
        const lastRowInViewport = this.api.getLastDisplayedRow();

        const blockContainsViewport = blockStart <= firstRowInViewport && blockEnd >= lastRowInViewport;
        const blockEndIsInViewport = blockEnd > firstRowInViewport && blockEnd < lastRowInViewport
        const blockStartIsInViewport = blockStart > firstRowInViewport && blockStart < lastRowInViewport;
        return blockContainsViewport || blockEndIsInViewport || blockStartIsInViewport;
    }

    private getNextBlockToLoad() {
        const ranges = this.getNodeRanges();
        const toLoad = Object.entries(ranges);
        if (toLoad.length === 0) {
            return null;
        }
    
        const firstRowInViewport = this.api.getFirstDisplayedRow();
        toLoad.sort(([aStart, aEnd], [bStart, bEnd]) => {
            const isAInViewport = this.isBlockInViewport(Number(aStart), aEnd);
            const isBInViewport = this.isBlockInViewport(Number(bStart), bEnd);

            // always prioritise loading blocks in viewport
            if (isAInViewport) {
                return -1;
            }

            // always prioritise loading blocks in viewport
            if (isBInViewport) {
                return 1;
            }

            // prioritise based on how close to the viewport the block is
            return Math.abs(firstRowInViewport - Number(aStart)) - Math.abs(firstRowInViewport - Number(bStart));
        });
        return toLoad[0];
    }

    public queueLoadAction() {
        const nextBlockToLoad = this.getNextBlockToLoad();
        if (!nextBlockToLoad) {
            // there's no block we should be loading right now, clear the timeouts
            window.clearTimeout(this.loaderTimeout);
            this.loaderTimeout = undefined;
            this.nextBlockToLoad = undefined;
            return;
        }

        // if the next required block has changed, reset the loading timeout
        if (!this.nextBlockToLoad || (this.nextBlockToLoad[0] !== nextBlockToLoad[0] && this.nextBlockToLoad[1] !== nextBlockToLoad[1])) {
            this.nextBlockToLoad = nextBlockToLoad;
            window.clearTimeout(this.loaderTimeout);

            const [startRowString, endRow] = this.nextBlockToLoad;
            const startRow = Number(startRowString);
            this.loaderTimeout = window.setTimeout(() => {
                this.loaderTimeout = undefined;
                this.attemptLoad(startRow, endRow);
                this.nextBlockToLoad = undefined;
            }, this.gridOptionsService.getNum('blockLoadDebounceMillis') ?? 0);
        }
    }

    private attemptLoad(start: number, end: number) {
        const availableLoadingCount = this.rowNodeBlockLoader.getAvailableLoadingCount();
        // too many loads already, ignore the request as a successful request will requeue itself anyway
        if (availableLoadingCount != null && availableLoadingCount === 0) {
            return;
        }

        this.rowNodeBlockLoader.registerLoads(1);
        this.executeLoad(start, end);

        this.queueLoadAction();
    }


    public getBlockSize() {
        return this.storeParams.cacheBlockSize || LazyBlockLoader.DEFAULT_BLOCK_SIZE;
    }

    public getBlockStartIndexForIndex(storeIndex: number): number {
        const blockSize = this.getBlockSize();
        return storeIndex - (storeIndex % blockSize);
    }

    public getBlockBoundsForIndex(storeIndex: number): [number, number] {
        const startOfBlock = this.getBlockStartIndexForIndex(storeIndex);
        const blockSize = this.getBlockSize();
        return [startOfBlock, startOfBlock + blockSize];
    }
}