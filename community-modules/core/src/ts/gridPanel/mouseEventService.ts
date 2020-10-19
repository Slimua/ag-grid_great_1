import { Bean, PostConstruct } from "../context/context";
import { Autowired } from "../context/context";
import { CellPosition } from "../entities/cellPosition";
import { GridOptionsWrapper } from "../gridOptionsWrapper";
import { CellComp } from "../rendering/cellComp";
import { NumberSequence } from '../utils';
import { GridPanel } from "./gridPanel";
import { Constants } from "../constants/constants";
import { DraggingEvent } from "../dragAndDrop/dragAndDropService";
import { BeanStub } from "../context/beanStub";
import { getEventPath, getCellCompForEvent } from "../utils/event";
import { exists } from "../utils/generic";

@Bean('mouseEventService')
export class MouseEventService extends BeanStub {

    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('eGridDiv') private eGridDiv: HTMLElement;

    private static gridInstanceSequence = new NumberSequence();
    private static GRID_DOM_KEY = '__ag_grid_instance';
    private gridPanel: GridPanel;

    private gridInstanceId = MouseEventService.gridInstanceSequence.next();

    @PostConstruct
    private init(): void {
        this.stampDomElementWithGridInstance();
    }

    public registerGridComp(gridPanel: GridPanel): void {
        this.gridPanel = gridPanel;
    }

    // we put the instance id onto the main DOM element. this is used for events, when grids are inside grids,
    // so the grid can work out if the even came from this grid or a grid inside this one. see the ctrl+v logic
    // for where this is used.
    private stampDomElementWithGridInstance(): void {
        (this.eGridDiv as any)[MouseEventService.GRID_DOM_KEY] = this.gridInstanceId;
    }

    public getRenderedCellForEvent(event: Event): CellComp | null {
        return getCellCompForEvent(this.gridOptionsWrapper, event);
    }

    // walks the path of the event, and returns true if this grid is the first one that it finds. if doing
    // master / detail grids, and a child grid is found, then it returns false. this stops things like copy/paste
    // getting executed on many grids at the same time.
    public isEventFromThisGrid(event: MouseEvent | KeyboardEvent): boolean {

        const path = getEventPath(event);

        for (let i = 0; i < path.length; i++) {
            const element = path[i];
            const instanceId = (element as any)[MouseEventService.GRID_DOM_KEY];
            if (exists(instanceId)) {
                const eventFromThisGrid = instanceId === this.gridInstanceId;
                return eventFromThisGrid;
            }
        }

        return false;
    }

    public getCellPositionForEvent(event: MouseEvent | KeyboardEvent): CellPosition | null {
        const cellComp = this.getRenderedCellForEvent(event);
        return cellComp ? cellComp.getCellPosition() : null;
    }

    public getNormalisedPosition(event: MouseEvent | DraggingEvent): { x: number, y: number; } {
        const gridPanelHasScrolls = this.gridOptionsWrapper.getDomLayout() === Constants.DOM_LAYOUT_NORMAL;
        const e = event as MouseEvent;
        let x: number;
        let y: number;

        if (e.clientX != null || e.clientY != null) {
            x = e.clientX;
            y = e.clientY;
        } else {
            x = e.x;
            y = e.y;
        }

        if (gridPanelHasScrolls) {
            const vRange = this.gridPanel.getVScrollPosition();
            const hRange = this.gridPanel.getHScrollPosition();
            x += hRange.left;
            y += vRange.top;
        }

        return { x, y };
    }

}
