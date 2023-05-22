import { Autowired, Bean, BeanStub, ChangedPath, Events, IRowModel, ISelectionService, IServerSideSelectionState, IServerSideGroupSelectionState, PostConstruct, RowNode, SelectionChangedEvent, SelectionEventSourceType, WithoutGridCommon, ISetNodeSelectedParams, ISetNodesSelectedParams } from "@ag-grid-community/core";
import { DefaultStrategy } from "./selection/strategies/defaultStrategy";
import { GroupSelectsChildrenStrategy } from "./selection/strategies/groupSelectsChildrenStrategy";
import { ISelectionStrategy } from "./selection/strategies/iSelectionStrategy";

@Bean('selectionService')
export class ServerSideSelectionService extends BeanStub implements ISelectionService {
    @Autowired('rowModel') private rowModel: IRowModel;
    private selectionStrategy: ISelectionStrategy;
    private rowSelection: 'single' | 'multiple' | undefined;

    @PostConstruct
    private init(): void {
        const groupSelectsChildren = this.gridOptionsService.is('groupSelectsChildren');
        this.addManagedPropertyListener('groupSelectsChildren', (propChange) => {
            this.destroyBean(this.selectionStrategy);

            const StrategyClazz = !propChange.currentValue ? DefaultStrategy : GroupSelectsChildrenStrategy;
            this.selectionStrategy = this.createManagedBean(new StrategyClazz());

            this.shotgunResetNodeSelectionState();
            const event: WithoutGridCommon<SelectionChangedEvent> = {
                type: Events.EVENT_SELECTION_CHANGED,
                source: 'api',
            };
            this.eventService.dispatchEvent(event);
        });

        this.rowSelection = this.gridOptionsService.get('rowSelection');
        this.addManagedPropertyListener('rowSelection', (propChange) => this.rowSelection = propChange.currentValue);

        const StrategyClazz = !groupSelectsChildren ? DefaultStrategy : GroupSelectsChildrenStrategy;
        this.selectionStrategy = this.createManagedBean(new StrategyClazz());
    }
 
    public getServerSideSelectionState() {
        return this.selectionStrategy.getSelectedState();
    }

    public setServerSideSelectionState(state: IServerSideSelectionState | IServerSideGroupSelectionState): void {
        this.selectionStrategy.setSelectedState(state);
        this.shotgunResetNodeSelectionState();

        const event: WithoutGridCommon<SelectionChangedEvent> = {
            type: Events.EVENT_SELECTION_CHANGED,
            source: 'api',
        };
        this.eventService.dispatchEvent(event);
    }
    
    public setNodeSelected(params: ISetNodeSelectedParams): number {
        const { node, ...other } = params;
        return this.setNodesSelected({ nodes: [node], ...other });
    }

    public setNodesSelected(params: ISetNodesSelectedParams): number {
        if (params.nodes.length > 1 && this.rowSelection !== 'multiple') {
            console.warn(`AG Grid: cannot multi select while rowSelection='single'`);
            return 0;
        }

        if (params.nodes.length > 1 && params.rangeSelect) {
            console.warn(`AG Grid: cannot use range selection when multi selecting rows`);
            return 0;
        }

        const changedNodes = this.selectionStrategy.setNodesSelected(params);
        this.shotgunResetNodeSelectionState(params.source);

        const event: WithoutGridCommon<SelectionChangedEvent> = {
            type: Events.EVENT_SELECTION_CHANGED,
            source: params.source,
        };
        this.eventService.dispatchEvent(event);
        return changedNodes;
    }

    /**
     * Deletes the selection state for a set of nodes, for use after deleting nodes via
     * transaction. As this is designed for transactions, all nodes should belong to the same group.
     */
    public deleteSelectionStateFromParent(storeRoute: string[], removedNodeIds: string[]) {
        const stateChanged = this.selectionStrategy.deleteSelectionStateFromParent(storeRoute, removedNodeIds);
        if (!stateChanged) {
            return;
        }

        this.shotgunResetNodeSelectionState();

        const event: WithoutGridCommon<SelectionChangedEvent> = {
            type: Events.EVENT_SELECTION_CHANGED,
            source: 'api',
        };
        this.eventService.dispatchEvent(event);
    }

    private shotgunResetNodeSelectionState(source?: SelectionEventSourceType) {
        this.rowModel.forEachNode(node => {
            if (node.stub) {
                return;
            }

            const isNodeSelected = this.selectionStrategy.isNodeSelected(node);
            if (isNodeSelected !== node.isSelected()) {
                node.selectThisNode(isNodeSelected, undefined, source);
            }
        });
    }

    public getSelectedNodes(): RowNode<any>[] {
        return this.selectionStrategy.getSelectedNodes();
    }

    public getSelectedRows(): any[] {
        return this.selectionStrategy.getSelectedRows();
    }

    public getSelectionCount(): number {
        return this.selectionStrategy.getSelectionCount();
    }

    public syncInRowNode(rowNode: RowNode<any>, oldNode: RowNode<any> | null): void {
        // update any refs being held in the strategies
        this.selectionStrategy.processNewRow(rowNode);

        const isNodeSelected = this.selectionStrategy.isNodeSelected(rowNode);
        rowNode.setSelectedInitialValue(isNodeSelected);
    }

    public reset(): void {
        this.selectionStrategy.deselectAllRowNodes({ source: 'api' });
    }

    public isEmpty(): boolean {
        return this.selectionStrategy.isEmpty();
    }

    public selectAllRowNodes(params: { source: SelectionEventSourceType; justFiltered?: boolean | undefined; justCurrentPage?: boolean | undefined; }): void {
        if (params.justCurrentPage || params.justFiltered) {
            console.warn("AG Grid: selecting just filtered only works when gridOptions.rowModelType='clientSide'");
        }

        this.selectionStrategy.selectAllRowNodes(params);

        this.rowModel.forEachNode(node => {
            if (node.stub) {
                return;
            }

            node.selectThisNode(true, undefined, params.source);
        });

        const event: WithoutGridCommon<SelectionChangedEvent> = {
            type: Events.EVENT_SELECTION_CHANGED,
            source: params.source,
        };
        this.eventService.dispatchEvent(event);
    }
    
    public deselectAllRowNodes(params: { source: SelectionEventSourceType; justFiltered?: boolean | undefined; justCurrentPage?: boolean | undefined; }): void {
        if (params.justCurrentPage || params.justFiltered) {
            console.warn("AG Grid: selecting just filtered only works when gridOptions.rowModelType='clientSide'");
        }

        this.selectionStrategy.deselectAllRowNodes(params);

        this.rowModel.forEachNode(node => {
            if (node.stub) {
                return;
            }

            node.selectThisNode(false, undefined, params.source);
        });

        const event: WithoutGridCommon<SelectionChangedEvent> = {
            type: Events.EVENT_SELECTION_CHANGED,
            source: params.source,
        };
        this.eventService.dispatchEvent(event);
    }

    public getSelectAllState(justFiltered?: boolean, justCurrentPage?: boolean): boolean | null {
        return this.selectionStrategy.getSelectAllState(justFiltered, justCurrentPage);
    }

    // used by CSRM
    public updateGroupsFromChildrenSelections(source: SelectionEventSourceType, changedPath?: ChangedPath | undefined): boolean {
        return false;
    }

    // used by CSRM
    public getBestCostNodeSelection(): RowNode<any>[] | undefined {
        console.warn('AG Grid: calling gridApi.getBestCostNodeSelection() is only possible when using rowModelType=`clientSide`.');
        return undefined;
    }

    // used by CSRM
    public filterFromSelection(): void {
        return;
    }
}