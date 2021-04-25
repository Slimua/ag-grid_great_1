import { Component, elementGettingCreated } from "../../widgets/component";
import { RefSelector } from "../../widgets/componentAnnotations";
import { Autowired, PostConstruct } from "../../context/context";
import { RowContainerController, RowContainerView } from "./rowContainerController";
import { ensureDomOrder, insertWithDomOrder } from "../../utils/dom";
import { GridOptionsWrapper } from "../../gridOptionsWrapper";
import { SetPinnedLeftWidthFeature } from "./setPinnedLeftWidthFeature";
import { SetPinnedRightWidthFeature } from "./setPinnedRightWidthFeature";
import { SetHeightFeature } from "./setHeightFeature";
import { Events } from "../../eventKeys";
import { RowRenderer } from "../../rendering/rowRenderer";
import { RowComp } from "../../rendering/row/rowComp";
import { RowController } from "../../rendering/row/rowController";
import { Beans } from "../../rendering/beans";
import { Constants } from "../../constants/constants";
import { CenterWidthFeature } from "../centerWidthFeature";
import { DragListenerFeature } from "./dragListenerFeature";
import { getAllValuesInObject } from "../../utils/object";
import { convertToMap } from "../../utils/map";

export enum RowContainerNames {
    LEFT = 'left',
    RIGHT = 'right',
    CENTER = 'center',
    FULL_WIDTH = 'fullWidth',

    TOP_LEFT = 'topLeft',
    TOP_RIGHT = 'topRight',
    TOP_CENTER = 'topCenter',
    TOP_FULL_WITH = 'topFullWidth',

    BOTTOM_LEFT = 'bottomLeft',
    BOTTOM_RIGHT = 'bottomRight',
    BOTTOM_CENTER = 'bottomCenter',
    BOTTOM_FULL_WITH = 'bottomFullWidth'
}

const ContainerCssClasses: Map<RowContainerNames, string> = convertToMap([
    [RowContainerNames.CENTER, 'ag-center-cols-container'],
    [RowContainerNames.LEFT, 'ag-pinned-left-cols-container'],
    [RowContainerNames.RIGHT, 'ag-pinned-right-cols-container'],
    [RowContainerNames.FULL_WIDTH, 'ag-full-width-container'],

    [RowContainerNames.TOP_CENTER, 'ag-floating-top-container'],
    [RowContainerNames.TOP_LEFT, 'ag-pinned-left-floating-top'],
    [RowContainerNames.TOP_RIGHT, 'ag-pinned-right-floating-top'],
    [RowContainerNames.TOP_FULL_WITH, 'ag-floating-top-full-width-container'],

    [RowContainerNames.BOTTOM_CENTER, 'ag-floating-bottom-container'],
    [RowContainerNames.BOTTOM_LEFT, 'ag-pinned-left-floating-bottom'],
    [RowContainerNames.BOTTOM_RIGHT, 'ag-pinned-right-floating-bottom'],
    [RowContainerNames.BOTTOM_FULL_WITH, 'ag-floating-bottom-full-width-container'],
]);

const ViewportCssClasses: Map<RowContainerNames, string> = convertToMap([
    [RowContainerNames.CENTER, 'ag-center-cols-viewport'],
    [RowContainerNames.TOP_CENTER, 'ag-floating-top-viewport'],
    [RowContainerNames.BOTTOM_CENTER, 'ag-floating-bottom-viewport'],
]);

const WrapperCssClasses: Map<RowContainerNames, string> = convertToMap([
    [RowContainerNames.CENTER, 'ag-center-cols-clipper'],
]);

function templateFactory(): string {
    const name = elementGettingCreated.getAttribute('name') as RowContainerNames;

    const containerClass = ContainerCssClasses.get(name);
    const viewportClass = ViewportCssClasses.get(name);
    const wrapperClass = WrapperCssClasses.get(name);

    let res: string;

    switch (name) {
        case RowContainerNames.LEFT :
        case RowContainerNames.RIGHT :
        case RowContainerNames.FULL_WIDTH :
        case RowContainerNames.TOP_LEFT :
        case RowContainerNames.TOP_RIGHT :
        case RowContainerNames.TOP_FULL_WITH :
        case RowContainerNames.BOTTOM_LEFT :
        case RowContainerNames.BOTTOM_RIGHT :
        case RowContainerNames.BOTTOM_FULL_WITH :
            res = /* html */
            `<div class="${containerClass}" ref="eContainer" role="presentation" unselectable="on"></div>`;
            break;

        case RowContainerNames.CENTER :
            res =  /* html */
            `<div class="${wrapperClass}" ref="eWrapper" role="presentation" unselectable="on">
                <div class="${viewportClass}" ref="eViewport" role="presentation">
                    <div class="${containerClass}" ref="eContainer" role="rowgroup" unselectable="on"></div>
                </div>
            </div>`;
            break;

        case RowContainerNames.TOP_CENTER :
        case RowContainerNames.BOTTOM_CENTER :
            res = /* html */
            `<div class="${viewportClass}" ref="eViewport" role="presentation" unselectable="on">
                <div class="${containerClass}" ref="eContainer" role="presentation" unselectable="on"></div>
            </div>`;
            break;

        default: return '';
    }

    return res;
}

export class RowContainerComp extends Component {
    @Autowired('rowRenderer') private rowRenderer: RowRenderer;
    @Autowired("beans") private beans: Beans;

    @RefSelector('eViewport') private eViewport: HTMLElement;
    @RefSelector('eContainer') private eContainer: HTMLElement;
    @RefSelector('eWrapper') private eWrapper: HTMLElement;

    private readonly name: RowContainerNames;

    private renderedRows: {[id: string]: RowComp} = {};
    private embedFullWidthRows: boolean;

    // we ensure the rows are in the dom in the order in which they appear on screen when the
    // user requests this via gridOptions.ensureDomOrder. this is typically used for screen readers.
    private domOrder: boolean;
    private lastPlacedElement: HTMLElement | null;

    constructor() {
        super(templateFactory());
        this.name = elementGettingCreated.getAttribute('name')! as RowContainerNames;
    }

    @PostConstruct
    private postConstruct(): void {
        this.embedFullWidthRows = this.gridOptionsWrapper.isEmbedFullWidthRows();

        const view: RowContainerView = {
            setViewportHeight: height => this.eViewport.style.height = height,
        };

        const con = this.createManagedBean(new RowContainerController(this.name));
        con.setView(view, this.eContainer, this.eViewport);

        this.listenOnDomOrder();

        this.stopHScrollOnPinnedRows();

        const allTopNoFW = [RowContainerNames.TOP_CENTER, RowContainerNames.TOP_LEFT, RowContainerNames.TOP_RIGHT];
        const allBottomNoFW = [RowContainerNames.BOTTOM_CENTER, RowContainerNames.BOTTOM_LEFT, RowContainerNames.BOTTOM_RIGHT];
        const allMiddleNoFW = [RowContainerNames.CENTER, RowContainerNames.LEFT, RowContainerNames.RIGHT];
        const allNoFW = [...allTopNoFW, ...allBottomNoFW, ...allMiddleNoFW];

        const allMiddle = [RowContainerNames.CENTER, RowContainerNames.LEFT, RowContainerNames.RIGHT, RowContainerNames.FULL_WIDTH];

        const allCenter = [RowContainerNames.CENTER, RowContainerNames.TOP_CENTER, RowContainerNames.BOTTOM_CENTER];
        const allLeft = [RowContainerNames.LEFT, RowContainerNames.BOTTOM_LEFT, RowContainerNames.TOP_LEFT];
        const allRight = [RowContainerNames.RIGHT, RowContainerNames.BOTTOM_RIGHT, RowContainerNames.TOP_RIGHT];

        this.forContainers(allLeft, () => this.createManagedBean(new SetPinnedLeftWidthFeature(this.eContainer)));
        this.forContainers(allRight, () => this.createManagedBean(new SetPinnedRightWidthFeature(this.eContainer)));
        this.forContainers(allMiddle, () => this.createManagedBean(new SetHeightFeature(this.eContainer, this.eWrapper)));
        this.forContainers(allNoFW, () => this.createManagedBean(new DragListenerFeature(this.eContainer)));

        this.forContainers(allCenter, () => this.createManagedBean(
            new CenterWidthFeature(width => this.eContainer.style.width = `${width}px`))
        );

        this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_ROWS_CHANGED, this.onDisplayedRowsChanged.bind(this));
    }

    private forContainers(names: RowContainerNames[], callback: (() => void)): void {
        if (names.indexOf(this.name) >= 0) {
            callback();
        }
    }

    // when editing a pinned row, if the cell is half outside the scrollable area, the browser can
    // scroll the column into view. we do not want this, the pinned sections should never scroll.
    // so we listen to scrolls on these containers and reset the scroll if we find one.
    private stopHScrollOnPinnedRows(): void {
        this.forContainers([RowContainerNames.TOP_CENTER, RowContainerNames.BOTTOM_CENTER], () => {
            const resetScrollLeft = () => this.eViewport.scrollLeft = 0;
            this.addManagedListener(this.eViewport, 'scroll', resetScrollLeft);
        });
    }

    private listenOnDomOrder(): void {
        const listener = () => this.domOrder = this.gridOptionsWrapper.isEnsureDomOrder();
        this.gridOptionsWrapper.addEventListener(GridOptionsWrapper.PROP_DOM_LAYOUT, listener);
        listener();
    }

    // this is repeated inside the controller, need to remove where this one is called from
    public getViewportElement(): HTMLElement {
        return this.eViewport;
    }

    public clearLastPlacedElement(): void {
        this.lastPlacedElement = null;
    }

    public appendRow(element: HTMLElement) {
        if (this.domOrder) {
            insertWithDomOrder(this.eContainer, element, this.lastPlacedElement);
        } else {
            this.eContainer.appendChild(element);
        }
        this.lastPlacedElement = element;
    }

    public ensureDomOrder(eRow: HTMLElement): void {
        if (this.domOrder) {
            ensureDomOrder(this.eContainer, eRow, this.lastPlacedElement);
            this.lastPlacedElement = eRow;
        }
    }

    public removeRow(eRow: HTMLElement): void {
        this.eContainer.removeChild(eRow);
    }

    private onDisplayedRowsChanged(): void {
        const fullWithContainer =
            this.name === RowContainerNames.TOP_FULL_WITH
            || this.name === RowContainerNames.BOTTOM_FULL_WITH
            || this.name === RowContainerNames.FULL_WIDTH;

        const oldRows = {...this.renderedRows};
        this.renderedRows = {};

        this.clearLastPlacedElement();

        const processRow = (rowCon: RowController) => {
            const instanceId = rowCon.getInstanceId();
            const existingRowComp = oldRows[instanceId];
            if (existingRowComp) {
                this.renderedRows[instanceId] = existingRowComp;
                delete oldRows[instanceId];
                this.ensureDomOrder(existingRowComp.getGui());
            } else {
                const rowComp = this.newRowComp(rowCon);
                this.renderedRows[instanceId] = rowComp;
                this.appendRow(rowComp.getGui());
            }
        };

        const doesRowMatch = (rowCon: RowController) => {
            const fullWidthController = rowCon.isFullWidth();

            const match = fullWithContainer ?
                !this.embedFullWidthRows && fullWidthController
                : this.embedFullWidthRows || !fullWidthController;

            return match;
        };

        const rowConsToRender = this.getRowCons();

        rowConsToRender.filter(doesRowMatch).forEach(processRow);

        getAllValuesInObject(oldRows).forEach(rowComp => this.removeRow(rowComp.getGui()));
    }

    private getRowCons(): RowController[] {
        switch (this.name) {
            case RowContainerNames.TOP_CENTER:
            case RowContainerNames.TOP_LEFT:
            case RowContainerNames.TOP_RIGHT:
            case RowContainerNames.TOP_FULL_WITH:
                return this.rowRenderer.getTopRowCons();

            case RowContainerNames.BOTTOM_CENTER:
            case RowContainerNames.BOTTOM_LEFT:
            case RowContainerNames.BOTTOM_RIGHT:
            case RowContainerNames.BOTTOM_FULL_WITH:
                return this.rowRenderer.getBottomRowCons();

            default:
                return this.rowRenderer.getRowCons();
        }
    }

    private newRowComp(rowCon: RowController): RowComp {
        let pinned: string | null;
        switch (this.name) {
            case RowContainerNames.BOTTOM_LEFT:
            case RowContainerNames.TOP_LEFT:
            case RowContainerNames.LEFT:
                pinned = Constants.PINNED_LEFT;
                break;
            case RowContainerNames.BOTTOM_RIGHT:
            case RowContainerNames.TOP_RIGHT:
            case RowContainerNames.RIGHT:
                pinned = Constants.PINNED_RIGHT;
                break;
            default:
                pinned = null;
                break;
        }
        const res = new RowComp(rowCon, this, this.beans, pinned);
        return res;
    }

}