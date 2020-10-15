import {
    RowBounds,
    _,
    Autowired,
    Bean,
    BeanStub,
    Column,
    ColumnController,
    GridOptionsWrapper,
    PostConstruct,
    RowNode,
    ValueService,
    IServerSideChildStore,
    NumberSequence
} from "@ag-grid-community/core";

@Bean('ssrmBlockUtils')
export class BlockUtils extends BeanStub {

    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('valueService') private valueService: ValueService;
    @Autowired('columnController') private columnController: ColumnController;

    private rowHeight: number;
    private usingTreeData: boolean;
    private usingMasterDetail: boolean;

    @PostConstruct
    private postConstruct(): void {
        this.rowHeight = this.gridOptionsWrapper.getRowHeightAsNumber()
        this.usingTreeData = this.gridOptionsWrapper.isTreeData();
        this.usingMasterDetail = this.gridOptionsWrapper.isMasterDetail();
    }

    public createRowNode(params: {group: boolean, leafGroup: boolean, level: number,
        parent: RowNode, field: string, rowGroupColumn: Column}): RowNode {

        const rowNode = this.getContext().createBean(new RowNode());

        rowNode.setRowHeight(this.rowHeight);

        rowNode.group = params.group;
        rowNode.leafGroup = params.leafGroup;
        rowNode.level = params.level;
        rowNode.uiLevel = params.level;
        rowNode.parent = params.parent;

        // stub gets set to true here, and then false when this rowNode gets it's data
        rowNode.stub = true;

        if (rowNode.group) {
            rowNode.expanded = false;
            rowNode.field = params.field;
            rowNode.rowGroupColumn = params.rowGroupColumn;
        }

        return rowNode;
    }

    public setDataIntoRowNode(rowNode: RowNode, data: any,  index: number, nodeIdPrefix: string): void {
        rowNode.stub = false;

        if (_.exists(data)) {
            // if the user is not providing id's, then we build an id based on the index.
            // we combine the index with the level and group key, so that the id is
            // unique across the set.
            //
            // unique id is needed for selection (so selection can be maintained when
            // doing server side sorting / filtering) - if user is not providing id's
            // (and we use the indexes) then selection will not work between sorting &
            // filtering.
            //
            // id's are also used by the row renderer for updating the dom as it identifies
            // rowNodes by id
            const defaultId = nodeIdPrefix + index.toString();

            rowNode.setDataAndId(data, defaultId);

            if (this.usingTreeData) {
                const isGroupFunc = this.gridOptionsWrapper.getIsServerSideGroupFunc();
                const getKeyFunc = this.gridOptionsWrapper.getServerSideGroupKeyFunc();

                if (isGroupFunc != null) {
                    rowNode.group = isGroupFunc(rowNode.data);
                    if (rowNode.group && getKeyFunc != null) {
                        rowNode.key = getKeyFunc(rowNode.data);
                    }
                }

            } else if (rowNode.group) {
                rowNode.key = this.valueService.getValue(rowNode.rowGroupColumn, rowNode);
                if (rowNode.key === null || rowNode.key === undefined) {
                    _.doOnce(() => {
                        console.warn(`null and undefined values are not allowed for server side row model keys`);
                        if (rowNode.rowGroupColumn) {
                            console.warn(`column = ${rowNode.rowGroupColumn.getId()}`);
                        }
                        console.warn(`data is `, rowNode.data);
                    }, 'ServerSideBlock-CannotHaveNullOrUndefinedForKey');
                }
            } else if (this.usingMasterDetail) {
                const isMasterFunc = this.gridOptionsWrapper.getIsRowMasterFunc();
                if (isMasterFunc != null) {
                    rowNode.master = isMasterFunc(rowNode.data);
                } else {
                    rowNode.master = true;
                }
            }

        } else {
            rowNode.setDataAndId(undefined, undefined);
            rowNode.key = null;
        }

        if (this.usingTreeData || rowNode.group) {
            this.setGroupDataIntoRowNode(rowNode);
            this.setChildCountIntoRowNode(rowNode);
        }

        // this needs to be done AFTER setGroupDataIntoRowNode(), as the height can depend on the group data
        // getting set, if it's a group node and colDef.autoHeight=true
        if (_.exists(data)) {
            rowNode.setRowHeight(this.gridOptionsWrapper.getRowHeightForNode(rowNode).height);
        }
    }

    private setChildCountIntoRowNode(rowNode: RowNode): void {
        const getChildCount = this.gridOptionsWrapper.getChildCountFunc();
        if (getChildCount) {
            rowNode.allChildrenCount = getChildCount(rowNode.data);
        }
    }

    private setGroupDataIntoRowNode(rowNode: RowNode): void {
        const groupDisplayCols: Column[] = this.columnController.getGroupDisplayColumns();

        const usingTreeData = this.gridOptionsWrapper.isTreeData();

        groupDisplayCols.forEach(col => {
            if (rowNode.groupData == null) {
                rowNode.groupData = {};
            }
            if (usingTreeData) {
                rowNode.groupData[col.getColId()] = rowNode.key;
            } else if (col.isRowGroupDisplayed(rowNode.rowGroupColumn.getId())) {
                const groupValue = this.valueService.getValue(rowNode.rowGroupColumn, rowNode);
                rowNode.groupData[col.getColId()] = groupValue;
            }
        });
    }

    public clearDisplayIndex(rowNode: RowNode): void {
        rowNode.clearRowTop();
        rowNode.setRowIndex(undefined);

        const hasChildStore = rowNode.group && _.exists(rowNode.childrenCache);
        if (hasChildStore) {
            const childStore = rowNode.childrenCache as IServerSideChildStore;
            childStore.clearDisplayIndexes();
        }

        const hasDetailNode = rowNode.master && rowNode.detailNode;
        if (hasDetailNode) {
            rowNode.detailNode.clearRowTop();
            rowNode.detailNode.setRowIndex(undefined);
        }
    }

    public setDisplayIndex(rowNode: RowNode, displayIndexSeq: NumberSequence, nextRowTop: { value: number }): void {
        // set this row
        rowNode.setRowIndex(displayIndexSeq.next());
        rowNode.setRowTop(nextRowTop.value);
        nextRowTop.value += rowNode.rowHeight;

        // set child for master / detail
        const hasDetailRow = rowNode.master;
        if (hasDetailRow) {
            if (rowNode.expanded && rowNode.detailNode) {
                rowNode.detailNode.setRowIndex(displayIndexSeq.next());
                rowNode.detailNode.setRowTop(nextRowTop.value);
                nextRowTop.value += rowNode.detailNode.rowHeight;
            } else if (rowNode.detailNode) {
                rowNode.detailNode.clearRowTop();
                rowNode.detailNode.setRowIndex(undefined);
            }
        }

        // set children for SSRM child rows
        const hasChildStore = rowNode.group && _.exists(rowNode.childrenCache);
        if (hasChildStore) {
            const childStore = rowNode.childrenCache as IServerSideChildStore;
            if (rowNode.expanded) {
                childStore.setDisplayIndexes(displayIndexSeq, nextRowTop);
            } else {
                // we need to clear the row tops, as the row renderer depends on
                // this to know if the row should be faded out
                childStore.clearDisplayIndexes();
            }
        }
    }

    public binarySearchForDisplayIndex(displayRowIndex: number, rowNodes: RowNode[]): RowNode | null {

        let bottomPointer = 0;
        let topPointer = rowNodes.length - 1;

        if (_.missing(topPointer) || _.missing(bottomPointer)) {
            console.warn(`ag-grid: error: topPointer = ${topPointer}, bottomPointer = ${bottomPointer}`);
            return null;
        }

        while (true) {
            const midPointer = Math.floor((bottomPointer + topPointer) / 2);
            const currentRowNode = rowNodes[midPointer];

            // first check current row for index
            if (currentRowNode.rowIndex === displayRowIndex) {
                return currentRowNode;
            }

            // then check if current row contains a detail row with the index
            const expandedMasterRow = currentRowNode.master && currentRowNode.expanded;
            if (expandedMasterRow && currentRowNode.detailNode.rowIndex === displayRowIndex) {
                return currentRowNode.detailNode;
            }

            // then check if child cache contains index
            const childStore = currentRowNode.childrenCache as IServerSideChildStore;
            if (currentRowNode.expanded && childStore && childStore.isDisplayIndexInStore(displayRowIndex)) {
                return childStore.getRowUsingDisplayIndex(displayRowIndex);
            }

            // otherwise adjust pointers to continue searching for index
            if (currentRowNode.rowIndex < displayRowIndex) {
                bottomPointer = midPointer + 1;
            } else if (currentRowNode.rowIndex > displayRowIndex) {
                topPointer = midPointer - 1;
            } else {
                console.warn(`ag-Grid: error: unable to locate rowIndex = ${displayRowIndex} in cache`);
                return null;
            }
        }
    }

    public extractRowBounds(rowNode: RowNode, index: number): RowBounds {

        const extractRowBounds = (rowNode: RowNode) => {
            return {
                rowHeight: rowNode.rowHeight,
                rowTop: rowNode.rowTop
            };
        };

        if (rowNode.rowIndex === index) {
            return extractRowBounds(rowNode);
        }

        if (rowNode.group && rowNode.expanded && _.exists(rowNode.childrenCache)) {
            const childStore = rowNode.childrenCache as IServerSideChildStore;
            if (childStore.isDisplayIndexInStore(index)) {
                return childStore.getRowBounds(index);
            }
        } else if (rowNode.master && rowNode.expanded && _.exists(rowNode.detailNode)) {
            if (rowNode.detailNode.rowIndex === index) {
                return extractRowBounds(rowNode.detailNode);
            }
        }
    }

    public getIndexAtPixel(rowNode: RowNode, pixel: number): number | undefined {
        // first check if pixel is in range of current row
        if (rowNode.isPixelInRange(pixel)) {
            return rowNode.rowIndex;
        }

        // then check if current row contains a detail row with pixel in range
        const expandedMasterRow = rowNode.master && rowNode.expanded;
        if (expandedMasterRow && rowNode.detailNode.isPixelInRange(pixel)) {
            return rowNode.detailNode.rowIndex;
        }

        // then check if it's a group row with a child cache with pixel in range
        if (rowNode.group && rowNode.expanded && _.exists(rowNode.childrenCache)) {
            const childStore = rowNode.childrenCache as IServerSideChildStore;
            if (childStore.isPixelInRange(pixel)) {
                return childStore.getRowIndexAtPixel(pixel);
            }
        }

        // pixel is not within this row node or it's children / detail, so return undefined
        return undefined;
    }

    public createNodeIdPrefix(parentRowNode: RowNode): string {
        const parts: string[] = [];
        let rowNode : RowNode | null = parentRowNode;

        // pull keys from all parent nodes, but do not include the root node
        while (rowNode && rowNode.level >= 0) {
            parts.push(rowNode.key);
            rowNode = rowNode.parent;
        }

        if (parts.length > 0) {
            return parts.reverse().join('-') + '-';
        } else {
            // no prefix, so node id's are left as they are
            return '';
        }
    }
}