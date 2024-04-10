import {
    Component,
    Events,
    PostConstruct,
    _
} from "@ag-grid-community/core";
import { PivotDropZonePanel } from "./pivotDropZonePanel";
import { RowGroupDropZonePanel } from "./rowGroupDropZonePanel";

export class GridHeaderDropZones extends Component {

    private rowGroupComp: Component;
    private pivotComp: Component;

    constructor() {
        super();
    }

    @PostConstruct
    private postConstruct(): void {
        this.setGui(this.createNorthPanel());

        this.addManagedEventListener(Events.EVENT_COLUMN_ROW_GROUP_CHANGED, () => this.onRowGroupChanged());
        this.addManagedEventListener(Events.EVENT_NEW_COLUMNS_LOADED, () => this.onRowGroupChanged());
        this.addManagedPropertyListener('rowGroupPanelShow', () => this.onRowGroupChanged());
        this.addManagedPropertyListener('pivotPanelShow', () => this.onPivotPanelShow());

        this.onRowGroupChanged();
    }

    private createNorthPanel(): HTMLElement {
        const topPanelGui = document.createElement('div');

        topPanelGui.classList.add('ag-column-drop-wrapper');
        _.setAriaRole(topPanelGui, 'presentation');

        this.rowGroupComp = new RowGroupDropZonePanel(true);
        this.createManagedBean(this.rowGroupComp);

        this.pivotComp = new PivotDropZonePanel(true);
        this.createManagedBean(this.pivotComp);

        topPanelGui.appendChild(this.rowGroupComp.getGui());
        topPanelGui.appendChild(this.pivotComp.getGui());

        this.addManagedListener(this.rowGroupComp, Component.EVENT_DISPLAYED_CHANGED, () => this.onDropPanelVisible());
        this.addManagedListener(this.pivotComp, Component.EVENT_DISPLAYED_CHANGED, () => this.onDropPanelVisible());

        this.onDropPanelVisible();

        return topPanelGui;
    }

    private onDropPanelVisible(): void {
        const bothDisplayed = this.rowGroupComp.isDisplayed() && this.pivotComp.isDisplayed();
        this.rowGroupComp.addOrRemoveCssClass('ag-column-drop-horizontal-half-width', bothDisplayed);
        this.pivotComp.addOrRemoveCssClass('ag-column-drop-horizontal-half-width', bothDisplayed);
    }

    private onRowGroupChanged(): void {
        if (!this.rowGroupComp) {
            return;
        }

        const rowGroupPanelShow = this.beans.gos.get('rowGroupPanelShow');

        if (rowGroupPanelShow === 'always') {
            this.rowGroupComp.setDisplayed(true);
        } else if (rowGroupPanelShow === 'onlyWhenGrouping') {
            const grouping = !this.beans.columnModel.isRowGroupEmpty();
            this.rowGroupComp.setDisplayed(grouping);
        } else {
            this.rowGroupComp.setDisplayed(false);
        }
    }

    private onPivotPanelShow() {
        if (!this.pivotComp) {
            return;
        }

        const pivotPanelShow = this.beans.gos.get('pivotPanelShow');

        if (pivotPanelShow === 'always') {
            this.pivotComp.setDisplayed(true);
        } else if (pivotPanelShow === 'onlyWhenPivoting') {
            const pivoting = this.beans.columnModel.isPivotActive();
            this.pivotComp.setDisplayed(pivoting);
        } else {
            this.pivotComp.setDisplayed(false);
        }
    }
}
