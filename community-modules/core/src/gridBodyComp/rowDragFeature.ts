import { AutoScrollService } from "../autoScrollService";
import { VerticalDirection } from "../constants/direction";
import { BeanStub } from "../context/beanStub";
import { PostConstruct } from "../context/context";
import {
    DragAndDropService,
    DraggingEvent,
    DragSourceType,
    DropTarget
} from "../dragAndDrop/dragAndDropService";
import { RowNode } from "../entities/rowNode";
import { Events } from "../eventKeys";
import { RowDragEndEvent, RowDragEnterEvent, RowDragEvent, RowDragLeaveEvent, RowDragMoveEvent } from "../events";
import { IClientSideRowModel } from "../interfaces/iClientSideRowModel";
import { RowHighlightPosition } from "../interfaces/iRowNode";
import { last } from '../utils/array';
import { warnOnce } from "../utils/function";

export interface RowDropZoneEvents {
    /** Callback function that will be executed when the rowDrag enters the target. */
    onDragEnter?: (params: RowDragEnterEvent) => void;
    /** Callback function that will be executed when the rowDrag leaves the target */
    onDragLeave?: (params: RowDragLeaveEvent) => void;
    /**
     * Callback function that will be executed when the rowDrag is dragged inside the target.
     * Note: this gets called multiple times.
     */
    onDragging?: (params: RowDragMoveEvent) => void;
    /** Callback function that will be executed when the rowDrag drops rows within the target. */
    onDragStop?: (params: RowDragEndEvent) => void;
}

export interface RowDropZoneParams extends RowDropZoneEvents {
    /** A callback method that returns the DropZone HTMLElement. */
    getContainer: () => HTMLElement;
}

export class RowDragFeature extends BeanStub implements DropTarget {

    private clientSideRowModel: IClientSideRowModel;
    private eContainer: HTMLElement;
    private lastDraggingEvent: DraggingEvent;
    private autoScrollService: AutoScrollService;

    constructor(eContainer: HTMLElement) {
        super();
        this.eContainer = eContainer;
    }

    @PostConstruct
    private postConstruct(): void {
        if (this.beans.gos.isRowModelType('clientSide')) {
            this.clientSideRowModel = this.beans.clientSideRowModel;
        }

        this.beans.ctrlsService.whenReady(() => {
            const gridBodyCon = this.beans.ctrlsService.getGridBodyCtrl();
            this.autoScrollService = new AutoScrollService({
                scrollContainer: gridBodyCon.getBodyViewportElement(),
                scrollAxis: 'y',
                getVerticalPosition: () => gridBodyCon.getScrollFeature().getVScrollPosition().top,
                setVerticalPosition: (position) => gridBodyCon.getScrollFeature().setVerticalScrollPosition(position),
                onScrollCallback: () => { this.onDragging(this.lastDraggingEvent); }
            });
        });
    }


    public getContainer(): HTMLElement {
        return this.eContainer;
    }

    public isInterestedIn(type: DragSourceType): boolean {
        return type === DragSourceType.RowDrag;
    }

    public getIconName(): string {
        const managedDrag = this.beans.gos.get('rowDragManaged');

        if (managedDrag && this.shouldPreventRowMove()) {
            return DragAndDropService.ICON_NOT_ALLOWED;
        }

        return DragAndDropService.ICON_MOVE;
    }

    public shouldPreventRowMove(): boolean {
        const rowGroupCols = this.beans.columnModel.getRowGroupColumns();
        if (rowGroupCols.length) {
            return true;
        }
        const isFilterPresent = this.beans.filterManager.isAnyFilterPresent();
        if (isFilterPresent) {
            return true;
        }
        const isSortActive = this.beans.sortController.isSortActive();
        if (isSortActive) {
            return true;
        }
        return false;
    }

    private getRowNodes(draggingEvent: DraggingEvent): RowNode[] {
        if (!this.isFromThisGrid(draggingEvent)) {
            return (draggingEvent.dragItem.rowNodes || []) as RowNode[];
        }

        const isRowDragMultiRow = this.beans.gos.get('rowDragMultiRow');
        const selectedNodes = [...this.beans.selectionService.getSelectedNodes()].sort(
            (a, b) => {
                if (a.rowIndex == null || b.rowIndex == null) { return 0; }

                return this.getRowIndexNumber(a) - this.getRowIndexNumber(b);
            }
        );

        const currentNode = draggingEvent.dragItem.rowNode! as RowNode;

        if (isRowDragMultiRow && selectedNodes.indexOf(currentNode) !== -1) {
            return selectedNodes;
        }

        return [currentNode];
    }

    public onDragEnter(draggingEvent: DraggingEvent): void {
        // builds a lits of all rows being dragged before firing events
        draggingEvent.dragItem.rowNodes = this.getRowNodes(draggingEvent);

        // when entering, we fire the enter event, then in onEnterOrDragging,
        // we also fire the move event. so we get both events when entering.
        this.dispatchGridEvent(Events.EVENT_ROW_DRAG_ENTER, draggingEvent);

        this.getRowNodes(draggingEvent).forEach(rowNode => {
            rowNode.setDragging(true);
        });

        this.onEnterOrDragging(draggingEvent);
    }

    public onDragging(draggingEvent: DraggingEvent): void {
        this.onEnterOrDragging(draggingEvent);
    }

    private isFromThisGrid(draggingEvent: DraggingEvent) {
        const { dragSourceDomDataKey } = draggingEvent.dragSource;

        return dragSourceDomDataKey === this.beans.gos.getDomDataKey();
    }

    private isDropZoneWithinThisGrid(draggingEvent: DraggingEvent): boolean {
        const gridBodyCon = this.beans.ctrlsService.getGridBodyCtrl();
        const gridGui = gridBodyCon.getGui();
        const { dropZoneTarget } = draggingEvent;

        return !gridGui.contains(dropZoneTarget);
    }

    private onEnterOrDragging(draggingEvent: DraggingEvent): void {
        // this event is fired for enter and move
        this.dispatchGridEvent(Events.EVENT_ROW_DRAG_MOVE, draggingEvent);

        this.lastDraggingEvent = draggingEvent;

        const pixel = this.beans.mouseEventService.getNormalisedPosition(draggingEvent).y;
        const managedDrag = this.beans.gos.get('rowDragManaged');

        if (managedDrag) {
            this.doManagedDrag(draggingEvent, pixel);
        }

        this.autoScrollService.check(draggingEvent.event);
    }

    private doManagedDrag(draggingEvent: DraggingEvent, pixel: number): void {
        const isFromThisGrid = this.isFromThisGrid(draggingEvent);
        const managedDrag = this.beans.gos.get('rowDragManaged');
        const rowNodes = draggingEvent.dragItem.rowNodes! as RowNode[];

        if (managedDrag && this.shouldPreventRowMove()) {
            return;
        }

        if (this.beans.gos.get('suppressMoveWhenRowDragging') || !isFromThisGrid) {
            if (!this.isDropZoneWithinThisGrid(draggingEvent)) {
                this.clientSideRowModel.highlightRowAtPixel(rowNodes[0], pixel);
            }
        } else {
            this.moveRows(rowNodes, pixel);
        }
    }

    private getRowIndexNumber(rowNode: RowNode): number {
        return parseInt(last(rowNode.getRowIndexString().split('-')), 10);
    }

    private moveRowAndClearHighlight(draggingEvent: DraggingEvent): void {
        const lastHighlightedRowNode = this.clientSideRowModel.getLastHighlightedRowNode();
        const isBelow = lastHighlightedRowNode && lastHighlightedRowNode.highlighted === RowHighlightPosition.Below;
        const pixel = this.beans.mouseEventService.getNormalisedPosition(draggingEvent).y;
        const rowNodes = draggingEvent.dragItem.rowNodes as RowNode[];

        let increment = isBelow ? 1 : 0;

        if (this.isFromThisGrid(draggingEvent)) {
            rowNodes!.forEach(rowNode => {
                if (rowNode.rowTop! < pixel) {
                    increment -= 1;
                }
            });
            this.moveRows(rowNodes!, pixel, increment);
        } else {
            const getRowIdFunc = this.beans.gos.getCallback('getRowId');

            let addIndex = this.clientSideRowModel.getRowIndexAtPixel(pixel) + 1;

            if (this.clientSideRowModel.getHighlightPosition(pixel) === RowHighlightPosition.Above) {
                addIndex--;
            }

            this.clientSideRowModel.updateRowData({
                add: rowNodes!
                    .map(node => node.data)
                    .filter(data => !this.clientSideRowModel.getRowNode(
                        getRowIdFunc ? getRowIdFunc({ data, level: 0 }) : data.id)
                    ),
                addIndex
            });
        }

        this.clearRowHighlight();
    }

    private clearRowHighlight(): void {
        this.clientSideRowModel.highlightRowAtPixel(null);
    }

    private moveRows(rowNodes: RowNode[], pixel: number, increment: number = 0): void {
        const rowWasMoved = this.clientSideRowModel.ensureRowsAtPixel(rowNodes, pixel, increment);

        if (rowWasMoved) {
            this.beans.focusService.clearFocusedCell();
            this.beans.rangeService?.removeAllCellRanges();
        }
    }

    public addRowDropZone(params: RowDropZoneParams & { fromGrid?: boolean }): void {
        if (!params.getContainer()) {
            warnOnce('addRowDropZone - A container target needs to be provided');
            return;
        }

        if (this.beans.dragAndDropService.findExternalZone(params)) {
            console.warn('AG Grid: addRowDropZone - target already exists in the list of DropZones. Use `removeRowDropZone` before adding it again.');
            return;
        }

        let processedParams: RowDropZoneParams = {
            getContainer: params.getContainer
        };

        if (params.fromGrid) {
            processedParams = params;
        } else {
            if (params.onDragEnter) {
                processedParams.onDragEnter = (e) => {
                    params.onDragEnter!(this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_ENTER, e as any));
                };
            }
            if (params.onDragLeave) {
                processedParams.onDragLeave = (e) => {
                    params.onDragLeave!(this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_LEAVE, e as any));
                };
            }
            if (params.onDragging) {
                processedParams.onDragging = (e) => {
                    params.onDragging!(this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_MOVE, e as any));
                };
            }
            if (params.onDragStop) {
                processedParams.onDragStop = (e) => {
                    params.onDragStop!(this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_END, e as any));
                };
            }
        }

        this.beans.dragAndDropService.addDropTarget({
            isInterestedIn: (type: DragSourceType) => type === DragSourceType.RowDrag,
            getIconName: () => DragAndDropService.ICON_MOVE,
            external: true,
            ...processedParams as any
        });
    }

    public getRowDropZone(events?: RowDropZoneEvents): RowDropZoneParams {
        const getContainer = this.getContainer.bind(this);
        const onDragEnter = this.onDragEnter.bind(this);
        const onDragLeave = this.onDragLeave.bind(this);
        const onDragging = this.onDragging.bind(this);
        const onDragStop = this.onDragStop.bind(this);

        if (!events) {
            return { getContainer, onDragEnter, onDragLeave, onDragging, onDragStop, /* @private */ fromGrid: true } as RowDropZoneParams;
        }

        return {
            getContainer,
            onDragEnter: events.onDragEnter
                ? ((e) => {
                    onDragEnter(e);
                    events.onDragEnter!(this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_ENTER, e as any));
                })
                : onDragEnter,
            onDragLeave: events.onDragLeave
                ? ((e) => {
                    onDragLeave(e);
                    events.onDragLeave!(this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_LEAVE, e as any));
                })
                : onDragLeave,
            onDragging: events.onDragging
                ? ((e) => {
                    onDragging(e);
                    events.onDragging!(this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_MOVE, e as any));
                })
                : onDragging,
            onDragStop: events.onDragStop
                ? ((e) => {
                    onDragStop(e);
                    events.onDragStop!(this.draggingToRowDragEvent(Events.EVENT_ROW_DRAG_END, e as any));
                })
                : onDragStop,
            fromGrid: true /* @private */
        } as RowDropZoneParams;
    }

    private draggingToRowDragEvent(type: string, draggingEvent: DraggingEvent): RowDragEvent {
        const yNormalised = this.beans.mouseEventService.getNormalisedPosition(draggingEvent).y;
        const mouseIsPastLastRow = yNormalised > this.beans.paginationProxy.getCurrentPageHeight();

        let overIndex = -1;
        let overNode: RowNode | undefined;

        if (!mouseIsPastLastRow) {
            overIndex = this.beans.rowModel.getRowIndexAtPixel(yNormalised);
            overNode = this.beans.rowModel.getRow(overIndex);
        }

        let vDirectionString: string | null;

        switch (draggingEvent.vDirection) {
            case VerticalDirection.Down:
                vDirectionString = 'down';
                break;
            case VerticalDirection.Up:
                vDirectionString = 'up';
                break;
            default:
                vDirectionString = null;
                break;
        }

        const event: RowDragEvent = this.beans.gos.addGridCommonParams({
            type: type,
            event: draggingEvent.event,
            node: draggingEvent.dragItem.rowNode!,
            nodes: draggingEvent.dragItem.rowNodes!,
            overIndex: overIndex,
            overNode: overNode,
            y: yNormalised,
            vDirection: vDirectionString!
        });

        return event;
    }

    private dispatchGridEvent(type: string, draggingEvent: DraggingEvent): void {
        const event = this.draggingToRowDragEvent(type, draggingEvent);

        this.beans.eventService.dispatchEvent(event);
    }

    public onDragLeave(draggingEvent: DraggingEvent): void {
        this.dispatchGridEvent(Events.EVENT_ROW_DRAG_LEAVE, draggingEvent);
        this.stopDragging(draggingEvent);

        if (this.beans.gos.get('rowDragManaged')) {
            this.clearRowHighlight();
        }
    }

    public onDragStop(draggingEvent: DraggingEvent): void {
        this.dispatchGridEvent(Events.EVENT_ROW_DRAG_END, draggingEvent);
        this.stopDragging(draggingEvent);

        if (
            this.beans.gos.get('rowDragManaged') &&
            (this.beans.gos.get('suppressMoveWhenRowDragging') || !this.isFromThisGrid(draggingEvent)) &&
            !this.isDropZoneWithinThisGrid(draggingEvent)
        ) {
            this.moveRowAndClearHighlight(draggingEvent);
        }
    }

    private stopDragging(draggingEvent: DraggingEvent): void {
        this.autoScrollService.ensureCleared();

        this.getRowNodes(draggingEvent).forEach(rowNode => {
            rowNode.setDragging(false);
        });
    }
}
