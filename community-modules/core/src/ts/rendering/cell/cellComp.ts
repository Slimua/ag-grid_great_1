import { Column } from "../../entities/column";
import { RowNode } from "../../entities/rowNode";
import { Beans } from "./../beans";
import { Component } from "../../widgets/component";
import { ICellEditorComp, ICellEditorParams } from "../../interfaces/iCellEditor";
import { ICellRendererComp } from "./../cellRenderers/iCellRenderer";
import { CheckboxSelectionComponent } from "./../checkboxSelectionComponent";
import { RowCtrl } from "./../row/rowCtrl";
import { RowDragComp } from "./../row/rowDragComp";
import { PopupEditorWrapper } from "./../cellEditors/popupEditorWrapper";
import { DndSourceComp } from "./../dndSourceComp";
import { TooltipParentComp } from "../../widgets/tooltipFeature";
import { setAriaColIndex, setAriaDescribedBy, setAriaSelected } from "../../utils/aria";
import { escapeString } from "../../utils/string";
import { missing } from "../../utils/generic";
import { addStylesToElement, clearElement, removeFromParent } from "../../utils/dom";
import { isBrowserIE } from "../../utils/browser";
import { CellCtrl, ICellComp } from "./cellCtrl";
import { UserCompDetails } from "../../components/framework/userComponentFactory";
import { _ } from "../../utils";
import { GridBodyComp } from "../../gridBodyComp/gridBodyComp";

export class CellComp extends Component implements TooltipParentComp {

    private eCellWrapper: HTMLElement | null;
    private eCellValue: HTMLElement;

    private beans: Beans;
    private column: Column;
    private rowNode: RowNode;
    private eRow: HTMLElement;

    private includeSelection: boolean;
    private includeRowDrag: boolean;
    private includeDndSource: boolean;

    private forceWrapper: boolean;

    private checkboxSelectionComp: CheckboxSelectionComponent | undefined;
    private dndSourceComp: DndSourceComp | undefined;
    private rowDraggingComp: RowDragComp | undefined;

    private hideEditorPopup: Function | null | undefined;
    private cellEditorPopupWrapper: PopupEditorWrapper | undefined;
    private cellEditor: ICellEditorComp | null | undefined;
    private cellEditorGui: HTMLElement | null;

    private cellRenderer: ICellRendererComp | null | undefined;
    private cellRendererGui: HTMLElement | null;
    private cellRendererClass: any;

    private autoHeightCell: boolean;

    private rowCtrl: RowCtrl | null;

    private scope: any = null;

    private cellCtrl: CellCtrl;

    private firstRender: boolean;

    // for angular 1 only
    private angularCompiledElement: any;

    // every time we go into edit mode, or back again, this gets incremented.
    // it's the components way of dealing with the async nature of framework components,
    // so if a framework component takes a while to be created, we know if the object
    // is still relevant when creating is finished. eg we could click edit / un-edit 20
    // times before the first React edit component comes back - we should discard
    // the first 19.
    private rendererVersion = 0;
    private editorVersion = 0;
    
    constructor(scope: any, beans: Beans, cellCtrl: CellCtrl,
        autoHeightCell: boolean, printLayout: boolean, eRow: HTMLElement, editingRow: boolean) {
        super();
        this.scope = scope;
        this.beans = beans;
        this.column = cellCtrl.getColumn();
        this.rowNode = cellCtrl.getRowNode();
        this.rowCtrl = cellCtrl.getRowCtrl();
        this.autoHeightCell = autoHeightCell;
        this.eRow = eRow;

        this.setTemplate(/* html */`<div comp-id="${this.getCompId()}"/>`);

        const eGui = this.getGui();
        const style = eGui.style;

        this.eCellValue = eGui;

        const setAttribute = (name: string, value: string | null | undefined, element?: HTMLElement) => {
            const actualElement = element ? element : eGui;
            if (value != null && value != '') {
                actualElement.setAttribute(name, value);
            } else {
                actualElement.removeAttribute(name);
            }
        };

        const compProxy: ICellComp = {
            addOrRemoveCssClass: (cssClassName, on) => this.addOrRemoveCssClass(cssClassName, on),
            setUserStyles: styles => addStylesToElement(eGui, styles),
            setAriaSelected: selected => setAriaSelected(eGui, selected),
            getFocusableElement: () => this.getFocusableElement(),
            setLeft: left => style.left = left,
            setWidth: width => style.width = width,
            setAriaColIndex: index => setAriaColIndex(this.getGui(), index),
            setHeight: height => style.height = height,
            setZIndex: zIndex => style.zIndex = zIndex,
            setTabIndex: tabIndex => setAttribute('tabindex', tabIndex.toString()),
            setRole: role => setAttribute('role', role),
            setColId: colId => setAttribute('col-id', colId),
            setTitle: title => setAttribute('title', title),
            setUnselectable: value => setAttribute('unselectable', value, this.eCellValue),
            setTransition: transition => style.transition = transition ? transition : '',

            setIncludeSelection: include => this.includeSelection = include,
            setIncludeRowDrag: include => this.includeRowDrag = include,
            setIncludeDndSource: include => this.includeDndSource = include,
            setForceWrapper: force => this.forceWrapper = force,

            setRenderDetails: (compDetails, valueToDisplay, force) =>
                this.setRenderDetails(compDetails, valueToDisplay, force),
            setEditDetails: (compDetails, popup, position) => 
                this.setEditDetails(compDetails, popup, position),

            getCellEditor: () => this.cellEditor || null,
            getCellRenderer: () => this.cellRenderer || null,
            getParentOfValue: () => this.eCellValue
        };

        this.cellCtrl = cellCtrl;
        cellCtrl.setComp(compProxy, false, this.scope, this.getGui(), printLayout, editingRow);
    }

    private setRenderDetails(compDetails: UserCompDetails | undefined, valueToDisplay: any, forceNewCellRendererInstance: boolean): void {
        // this can happen if the users asks for the cell to refresh, but we are not showing the vale as we are editing
        const isInlineEditing = this.cellEditor && !this.cellEditorPopupWrapper;
        if (isInlineEditing) { return; }

        // this means firstRender will be true for one pass only, as it's initialised to undefined
        this.firstRender = this.firstRender == null;

        const usingAngular1Template = this.isUsingAngular1Template();

        // if display template has changed, means any previous Cell Renderer is in the wrong location
        const controlWrapperChanged = this.setupControlsWrapper();

        // all of these have dependencies on the eGui, so only do them after eGui is set
        if (compDetails) {
            const neverRefresh = forceNewCellRendererInstance || controlWrapperChanged;
            const cellRendererRefreshSuccessful = neverRefresh ? false : this.refreshCellRenderer(compDetails);
            if (!cellRendererRefreshSuccessful) {
                this.destroyRenderer();
                this.createCellRendererInstance(compDetails);
            }
        } else {
            this.destroyRenderer();
            if (usingAngular1Template) {
                this.insertValueUsingAngular1Template();
            } else {
                this.insertValueWithoutCellRenderer(valueToDisplay);
            }
        }
    }

    private setEditDetails(compDetails: UserCompDetails | undefined, popup?: boolean, position?: string): void {
        if (compDetails) {
            this.createCellEditorInstance(compDetails, popup, position);
        } else {
            this.destroyEditor();
        }
    }

    private removeControlsWrapper(): void {
        this.eCellValue = this.getGui();
        this.eCellWrapper = null;

        this.checkboxSelectionComp = this.beans.context.destroyBean(this.checkboxSelectionComp);
        this.dndSourceComp = this.beans.context.destroyBean(this.dndSourceComp);
        this.rowDraggingComp = this.beans.context.destroyBean(this.rowDraggingComp);
    }

    // returns true if wrapper was changed
    private setupControlsWrapper(): boolean {
        const usingWrapper = this.includeRowDrag || this.includeDndSource || this.includeSelection || this.forceWrapper;

        const changed = true;
        const notChanged = false;

        this.addOrRemoveCssClass('ag-cell-value', !usingWrapper);

        // turn wrapper on
        if (usingWrapper && !this.eCellWrapper) {
            this.addControlsWrapper();
            return changed;
        }

        // turn wrapper off
        if (!usingWrapper && this.eCellWrapper) {
            this.removeControlsWrapper();
            return changed;
        }

        return notChanged;
    }

    private addControlsWrapper(): void {
        const eGui = this.getGui();

        eGui.innerHTML = /* html */
            `<div ref="eCellWrapper" class="ag-cell-wrapper" role="presentation">
                <span ref="eCellValue" class="ag-cell-value" role="presentation"></span>
            </div>`;

        this.eCellValue = this.getRefElement('eCellValue');
        this.eCellWrapper = this.getRefElement('eCellWrapper');

        if (!this.forceWrapper) {
            this.eCellValue.setAttribute('unselectable', 'on');
        }

        const id = this.eCellValue.id = `cell-${this.getCompId()}`;
        const describedByIds: string[] = [];

        if (this.includeRowDrag) {
            this.rowDraggingComp = this.cellCtrl.createRowDragComp();
            if (this.rowDraggingComp) {
                // put the checkbox in before the value
                this.eCellWrapper!.insertBefore(this.rowDraggingComp.getGui(), this.eCellValue);
            }
        }

        if (this.includeDndSource) {
            this.dndSourceComp = this.cellCtrl.createDndSource();
            // put the checkbox in before the value
            this.eCellWrapper!.insertBefore(this.dndSourceComp.getGui(), this.eCellValue);
        }

        if (this.includeSelection) {
            this.checkboxSelectionComp = this.cellCtrl.createSelectionCheckbox();
            this.eCellWrapper!.insertBefore(this.checkboxSelectionComp.getGui(), this.eCellValue);
            describedByIds.push(this.checkboxSelectionComp.getCheckboxId());
        }

        describedByIds.push(id);

        setAriaDescribedBy(this.getGui(), describedByIds.join(' '));
    }

    private createCellEditorInstance(compDetails: UserCompDetails, popup?: boolean, position?: string): void {
        const versionCopy = this.editorVersion;

        const cellEditorPromise = this.beans.userComponentFactory.createCellEditor(compDetails);
        if (!cellEditorPromise) { return; } // if empty, userComponentFactory already did a console message

        const { params } = compDetails;
        cellEditorPromise.then(c => this.afterCellEditorCreated(versionCopy, c!, params, popup, position));

        // if we don't do this, and editor component is async, then there will be a period
        // when the component isn't present and keyboard navigation won't work - so example
        // of user hitting tab quickly (more quickly than renderers getting created) won't work
        const cellEditorAsync = missing(this.cellEditor);
        if (cellEditorAsync && params.cellStartedEdit) {
            this.cellCtrl.focusCell(true);
        }
    }

    private insertValueWithoutCellRenderer(valueToDisplay: any): void {
        const escapedValue = valueToDisplay != null ? escapeString(valueToDisplay) : null;
        if (escapedValue != null) {
            this.eCellValue.innerHTML = escapedValue;
        } else {
            clearElement(this.eCellValue);
        }
    }

    private insertValueUsingAngular1Template(): void {
        const { template, templateUrl } = this.column.getColDef();

        let templateToInsert: string | undefined = undefined;

        if (template != null) {
            templateToInsert = template;
        } else if (templateUrl != null) {
            // first time this happens it will return nothing, as the template will still be loading async,
            // however once loaded it will refresh the cell and second time around it will be returned sync
            // as in cache.
            templateToInsert = this.beans.templateService.getTemplate(templateUrl,
                () => this.cellCtrl.refreshCell({forceRefresh: true}));
        } else {
            // should never happen, as we only enter this method when template or templateUrl exist
        }

        if (templateToInsert!=null) {
            this.eCellValue.innerHTML = templateToInsert;
            this.updateAngular1ScopeAndCompile();
        }
    }

    private destroyEditorAndRenderer(): void {
        this.destroyRenderer();
        this.destroyEditor();
    }

    private destroyRenderer(): void {
        const {context} = this.beans;
        this.cellRenderer = context.destroyBean(this.cellRenderer);
        removeFromParent(this.cellRendererGui);
        this.cellRendererGui = null;
        this.rendererVersion++;
    }

    private destroyEditor(): void {
        const {context} = this.beans;

        if (this.hideEditorPopup) { this.hideEditorPopup(); }
        this.hideEditorPopup = undefined;

        this.cellEditor = context.destroyBean(this.cellEditor);
        this.cellEditorPopupWrapper = context.destroyBean(this.cellEditorPopupWrapper);

        removeFromParent(this.cellEditorGui);
        this.cellEditorGui = null;

        this.editorVersion++;
    }

    private refreshCellRenderer(compClassAndParams: UserCompDetails): boolean {
        if (this.cellRenderer == null || this.cellRenderer.refresh == null) { return false; }

        // if different Cell Renderer configured this time (eg user is using selector, and
        // returns different component) then don't refresh, force recreate of Cell Renderer
        if (this.cellRendererClass !== compClassAndParams.componentClass) { return false; }

        // take any custom params off of the user
        const result = this.cellRenderer.refresh(compClassAndParams.params);

        // NOTE on undefined: previous version of the cellRenderer.refresh() interface
        // returned nothing, if the method existed, we assumed it refreshed. so for
        // backwards compatibility, we assume if method exists and returns nothing,
        // that it was successful.
        return result === true || result === undefined;
    }

    private createCellRendererInstance(compClassAndParams: UserCompDetails): void {
        // never use task service if angularCompileRows=true, as that assume the cell renderers
        // are finished when the row is created. also we never use it if animation frame service
        // is turned off.
        // and lastly we never use it if doing auto-height, as the auto-height service checks the
        // row height directly after the cell is created, it doesn't wait around for the tasks to complete
        const angularCompileRows = this.beans.gridOptionsWrapper.isAngularCompileRows();
        const suppressAnimationFrame = this.beans.gridOptionsWrapper.isSuppressAnimationFrame();
        const useTaskService = !angularCompileRows && !suppressAnimationFrame && !this.autoHeightCell;

        const displayComponentVersionCopy = this.rendererVersion;

        const {componentClass} = compClassAndParams;

        const createCellRendererFunc = () => {
            const staleTask = this.rendererVersion !== displayComponentVersionCopy || !this.isAlive();
            if (staleTask) { return; }

            // this can return null in the event that the user has switched from a renderer component to nothing, for example
            // when using a cellRendererSelect to return a component or null depending on row data etc
            const componentPromise = this.beans.userComponentFactory.createCellRenderer(compClassAndParams);
            const callback = this.afterCellRendererCreated.bind(this, displayComponentVersionCopy, componentClass);
            if (componentPromise) {
                componentPromise.then(callback);
            }
        };

        // we only use task service when rendering for first time, which means it is not used when doing edits.
        // if we changed this (always use task service) would make sense, however it would break tests, possibly
        // test of users.
        if (useTaskService && this.firstRender) {
            this.beans.taskQueue.createTask(createCellRendererFunc, this.rowNode.rowIndex!, 'createTasksP2');
        } else {
            createCellRendererFunc();
        }
    }

    private isUsingAngular1Template(): boolean {
        const colDef = this.column.getColDef();
        const res = colDef.template != null || colDef.templateUrl != null;
        return res;
    }

    public getCtrl(): CellCtrl {
        return this.cellCtrl;
    }

    public getRowCtrl(): RowCtrl | null {
        return this.rowCtrl;
    }

    public getCellRenderer(): ICellRendererComp | null | undefined {
        return this.cellRenderer;
    }

    public getCellEditor(): ICellEditorComp | null | undefined {
        return this.cellEditor;
    }

    private afterCellRendererCreated(cellRendererVersion: number, cellRendererClass: any, cellRenderer: ICellRendererComp): void {
        const staleTask = !this.isAlive() || cellRendererVersion !== this.rendererVersion;

        if (staleTask) {
            this.beans.context.destroyBean(cellRenderer);
            return;
        }

        this.cellRenderer = cellRenderer;
        this.cellRendererClass = cellRendererClass;
        this.cellRendererGui = this.cellRenderer.getGui();

        if (this.cellRendererGui != null) {
            clearElement(this.eCellValue);
            this.eCellValue.appendChild(this.cellRendererGui);
            this.updateAngular1ScopeAndCompile();
        }
    }

    private afterCellEditorCreated(requestVersion: number, cellEditor: ICellEditorComp, params: ICellEditorParams, popup?: boolean, position?: string): void {

        // if editingCell=false, means user cancelled the editor before component was ready.
        // if versionMismatch, then user cancelled the edit, then started the edit again, and this
        //   is the first editor which is now stale.
        const staleComp = requestVersion !== this.editorVersion;

        if (staleComp) {
            this.beans.context.destroyBean(cellEditor);
            return;
        }

        const editingCancelledByUserComp = cellEditor.isCancelBeforeStart && cellEditor.isCancelBeforeStart();
        if (editingCancelledByUserComp) {
            this.beans.context.destroyBean(cellEditor);
            this.cellCtrl.stopEditing();
            return;
        }

        if (!cellEditor.getGui) {
            console.warn(`AG Grid: cellEditor for column ${this.column.getId()} is missing getGui() method`);
            this.beans.context.destroyBean(cellEditor);
            return;
        }

        this.cellEditor = cellEditor;
        this.cellEditorGui = cellEditor.getGui();

        const cellEditorInPopup = popup || (cellEditor.isPopup !== undefined && cellEditor.isPopup());
        if (cellEditorInPopup) {
            if (!popup) {
                this.cellCtrl.hackSayEditingInPopup();
            }
            this.addPopupCellEditor(params, position);
        } else {
            this.addInCellEditor();
        }

        if (cellEditor.afterGuiAttached) {
            cellEditor.afterGuiAttached();
        }
    }

    private addInCellEditor(): void {
        const eGui = this.getGui();

        // if focus is inside the cell, we move focus to the cell itself
        // before removing it's contents, otherwise errors could be thrown.
        if (eGui.contains(document.activeElement)) {
            eGui.focus();
        }

        this.destroyRenderer();
        this.removeControlsWrapper();
        this.clearCellElement();
        if (this.cellEditorGui) {
            eGui.appendChild(this.cellEditorGui);
        }
    }

    private addPopupCellEditor(params: ICellEditorParams, position?: string): void {
        if (this.beans.gridOptionsWrapper.isFullRowEdit()) {
            console.warn('AG Grid: popup cellEditor does not work with fullRowEdit - you cannot use them both ' +
                '- either turn off fullRowEdit, or stop using popup editors.');
        }

        const cellEditor = this.cellEditor!;

        // if a popup, then we wrap in a popup editor and return the popup
        this.cellEditorPopupWrapper = this.beans.context.createBean(new PopupEditorWrapper(params));
        const ePopupGui = this.cellEditorPopupWrapper.getGui();
        if (this.cellEditorGui) {
            ePopupGui.appendChild(this.cellEditorGui);
        }

        const popupService = this.beans.popupService;

        const useModelPopup = this.beans.gridOptionsWrapper.isStopEditingWhenCellsLoseFocus();

        // see if position provided by colDef, if not then check old way of method on cellComp
        const positionToUse = position != null ? position : cellEditor.getPopupPosition ? cellEditor.getPopupPosition() : 'over';

        const positionParams = {
            column: this.column,
            rowNode: this.rowNode,
            type: 'popupCellEditor',
            eventSource: this.getGui(),
            ePopup: ePopupGui,
            keepWithinBounds: true
        };

        const positionCallback = position === 'under' ?
            popupService.positionPopupUnderComponent.bind(popupService, positionParams)
            : popupService.positionPopupOverComponent.bind(popupService, positionParams);

        const addPopupRes = popupService.addPopup({
            modal: useModelPopup,
            eChild: ePopupGui,
            closeOnEsc: true,
            closedCallback: () => { this.cellCtrl.onPopupEditorClosed(); },
            anchorToElement: this.getGui(),
            positionCallback
        });
        if (addPopupRes) {
            this.hideEditorPopup = addPopupRes.hideFunc;
        }
    }

    public detach(): void {
        this.eRow.removeChild(this.getGui());
    }

    // if the row is also getting destroyed, then we don't need to remove from dom,
    // as the row will also get removed, so no need to take out the cells from the row
    // if the row is going (removing is an expensive operation, so only need to remove
    // the top part)
    //
    // note - this is NOT called by context, as we don't wire / unwire the CellComp for performance reasons.
    public destroy(): void {
        this.cellCtrl.stopEditing();

        this.destroyEditorAndRenderer();
        this.removeControlsWrapper();

        if (this.angularCompiledElement) {
            this.angularCompiledElement.remove();
            this.angularCompiledElement = undefined;
        }

        super.destroy();
    }

    private clearCellElement(): void {
        const eGui = this.getGui();

        // if focus is inside the cell, we move focus to the cell itself
        // before removing it's contents, otherwise errors could be thrown.
        if (eGui.contains(document.activeElement) && !isBrowserIE()) {
            eGui.focus({
                preventScroll: true
            });
        }

        clearElement(eGui);
    }

    private updateAngular1ScopeAndCompile() {
        if (this.beans.gridOptionsWrapper.isAngularCompileRows() && this.scope) {
            this.scope.data = { ...this.rowNode.data };

            if (this.angularCompiledElement) {
                this.angularCompiledElement.remove();
            }

            this.angularCompiledElement = this.beans.$compile(this.eCellValue.children)(this.scope);

            // because this.scope is set, we are guaranteed GridBodyComp is vanilla JS, ie it's GridBodyComp.ts from AG Stack and and not react
            this.beans.ctrlsService.getGridBodyCtrl().requestAngularApply();
        }
    }
}
