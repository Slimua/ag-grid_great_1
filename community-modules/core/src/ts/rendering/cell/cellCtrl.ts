import { Beans } from "./../beans";
import { Column } from "../../entities/column";
import { ColDef, NewValueParams } from "../../entities/colDef";
import { CellChangedEvent, RowNode } from "../../entities/rowNode";
import { CellPosition } from "../../entities/cellPosition";
import {
    CellContextMenuEvent,
    CellEditingStartedEvent,
    CellEvent,
    CellFocusedEvent,
    Events,
    FlashCellsEvent
} from "../../events";
import { GridOptionsWrapper } from "../../gridOptionsWrapper";
import { CellRangeFeature } from "./cellRangeFeature";
import { exists } from "../../utils/generic";
import { BeanStub } from "../../context/beanStub";
import { CellPositionFeature } from "./cellPositionFeature";
import { escapeString } from "../../utils/string";
import { CellCustomStyleFeature } from "./cellCustomStyleFeature";
import { CellTooltipFeature } from "./cellTooltipFeature";
import { RowPosition } from "../../entities/rowPosition";
import { RowCtrl } from "../row/rowCtrl";
import { CellMouseListenerFeature } from "./cellMouseListenerFeature";
import { CellKeyboardListenerFeature } from "./cellKeyboardListenerFeature";
import { ICellRenderer, ICellRendererParams } from "../cellRenderers/iCellRenderer";
import { ICellEditor, ICellEditorParams } from "../../interfaces/iCellEditor";
import { KeyCode } from "../../constants/keyCode";
import { UserCompDetails } from "../../components/framework/userComponentFactory";

const CSS_CELL = 'ag-cell';
const CSS_AUTO_HEIGHT = 'ag-cell-auto-height';
const CSS_CELL_FOCUS = 'ag-cell-focus';
const CSS_CELL_FIRST_RIGHT_PINNED = 'ag-cell-first-right-pinned';
const CSS_CELL_LAST_LEFT_PINNED = 'ag-cell-last-left-pinned';
const CSS_CELL_NOT_INLINE_EDITING = 'ag-cell-not-inline-editing';
const CSS_CELL_INLINE_EDITING = 'ag-cell-inline-editing';
const CSS_CELL_POPUP_EDITING = 'ag-cell-popup-editing';
const CSS_COLUMN_HOVER = 'ag-column-hover';
const CSS_CELL_WRAP_TEXT = 'ag-cell-wrap-text';

export interface ICellComp {
    addOrRemoveCssClass(cssClassName: string, on: boolean): void;
    setUserStyles(styles: any): void;
    setAriaSelected(selected: boolean | undefined): void;
    getFocusableElement(): HTMLElement;

    setLeft(left: string): void;
    setWidth(width: string): void;
    setAriaColIndex(index: number): void;
    setHeight(height: string): void;
    setZIndex(zIndex: string): void;
    setTabIndex(tabIndex: number): void;
    setRole(role: string): void;
    setColId(colId: string): void;
    setTitle(title: string | undefined): void;
    setUnselectable(value: string | null): void;
    setTransition(value: string | undefined): void;

    setIncludeSelection(include: boolean): void;
    setIncludeRowDrag(include: boolean): void;
    setIncludeDndSource(include: boolean): void;
    setForceWrapper(force: boolean): void;

    getCellEditor(): ICellEditor | null;
    getCellRenderer(): ICellRenderer | null;
    getParentOfValue(): HTMLElement | null;

    showValue(valueToDisplay: any, compDetails: UserCompDetails | undefined, forceNewCellRendererInstance: boolean): void;
    editValue(compClassAndParams: UserCompDetails): void;

    // hacks
    addRowDragging(customElement?: HTMLElement, dragStartPixels?: number): void;
}

let instanceIdSequence = 0;

export class CellCtrl extends BeanStub {

    public static DOM_DATA_KEY_CELL_CTRL = 'cellCtrl';

    private instanceId = instanceIdSequence++;

    private eGui: HTMLElement;
    private cellComp: ICellComp;
    private beans: Beans;
    private gow: GridOptionsWrapper;
    private column: Column;
    private colDef: ColDef;
    private rowNode: RowNode;
    private rowCtrl: RowCtrl | null;

    private autoHeightCell: boolean;
    private printLayout: boolean;

    private value: any;
    private valueFormatted: any;

    // just passed in
    private scope: any;

    private cellRangeFeature: CellRangeFeature;
    private cellPositionFeature: CellPositionFeature;
    private cellCustomStyleFeature: CellCustomStyleFeature;
    private cellTooltipFeature: CellTooltipFeature;
    private cellMouseListenerFeature: CellMouseListenerFeature;
    private cellKeyboardListenerFeature: CellKeyboardListenerFeature;

    private cellPosition: CellPosition;

    private editing: boolean;

    private includeSelection: boolean;
    private includeDndSource: boolean;
    private includeRowDrag: boolean;

    private suppressRefreshCell = false;

    constructor(column: Column, rowNode: RowNode, beans: Beans, rowCtrl: RowCtrl | null) {
        super();
        this.column = column;
        this.colDef = column.getColDef();
        this.rowNode = rowNode;
        this.beans = beans;
        this.rowCtrl = rowCtrl;

        this.createCellPosition();
        this.addFeatures();
    }

    private addFeatures(): void {
        this.cellPositionFeature = new CellPositionFeature(this, this.beans);
        this.addDestroyFunc(() => this.cellPositionFeature.destroy());

        this.cellCustomStyleFeature = new CellCustomStyleFeature(this, this.beans);
        this.addDestroyFunc(() => this.cellCustomStyleFeature.destroy());

        this.cellTooltipFeature = new CellTooltipFeature(this, this.beans);
        this.addDestroyFunc(() => this.cellTooltipFeature.destroy());

        this.cellMouseListenerFeature = new CellMouseListenerFeature(this, this.beans, this.column, this.rowNode, this.scope);
        this.addDestroyFunc(() => this.cellMouseListenerFeature.destroy());

        this.cellKeyboardListenerFeature = new CellKeyboardListenerFeature(this, this.beans, this.column, this.rowNode, this.scope, this.rowCtrl);
        this.addDestroyFunc(() => this.cellKeyboardListenerFeature.destroy());

        const rangeSelectionEnabled = this.beans.rangeService && this.beans.gridOptionsWrapper.isEnableRangeSelection();
        if (rangeSelectionEnabled) {
            this.cellRangeFeature = new CellRangeFeature(this.beans, this);
        }
    }

    public setComp(comp: ICellComp, autoHeightCell: boolean,
                   scope: any, eGui: HTMLElement, printLayout: boolean,
                   startEditing: boolean): void {
        this.cellComp = comp;
        this.autoHeightCell = autoHeightCell;
        this.gow = this.beans.gridOptionsWrapper;
        this.scope = scope;
        this.eGui = eGui;
        this.printLayout = printLayout;

        // we force to make sure formatter gets called at least once,
        // even if value has not changed (is is undefined)
        this.updateAndFormatValue(true);

        this.addDomData();

        this.onCellFocused();

        this.applyStaticCssClasses();

        this.onFirstRightPinnedChanged();
        this.onLastLeftPinnedChanged();
        this.onColumnHover();
        this.setupControlComps();

        const colIdSanitised = escapeString(this.column.getId());
        const ariaColIndex = this.beans.columnModel.getAriaColumnIndex(this.column);

        this.cellComp.setTabIndex(-1);
        this.cellComp.setRole('gridcell');
        this.cellComp.setAriaColIndex(ariaColIndex);
        this.cellComp.setColId(colIdSanitised!);
        this.cellComp.setUnselectable(!this.beans.gridOptionsWrapper.isEnableCellTextSelection() ? 'on' : null);

        this.cellPositionFeature.setComp(comp);
        this.cellCustomStyleFeature.setComp(comp, scope);
        this.cellTooltipFeature.setComp(comp);
        this.cellMouseListenerFeature.setComp(comp);
        this.cellKeyboardListenerFeature.setComp(comp, this.eGui);
        if (this.cellRangeFeature) { this.cellRangeFeature.setComp(comp); }

        if (startEditing && this.isCellEditable()) {
            this.startEditing();
        } else {
            this.showValue();
        }
    }

    public getInstanceId(): number {
        return this.instanceId;
    }

    private showValue(forceNewCellRendererInstance = false): void {
        this.setEditing(false);
        const valueToDisplay = this.valueFormatted != null ? this.valueFormatted : this.value;
        const params = this.createCellRendererParams();
        const cellRendererDetails = this.beans.userComponentFactory.getCellRendererDetails(this.colDef, params);
        this.cellComp.showValue(valueToDisplay, cellRendererDetails, forceNewCellRendererInstance);
        this.refreshHandle();
    }

    private setupControlComps(): void {
        const colDef = this.column.getColDef();
        this.includeSelection = this.isIncludeControl(colDef.checkboxSelection);
        this.includeRowDrag = this.isIncludeControl(colDef.rowDrag);
        this.includeDndSource = this.isIncludeControl(colDef.dndSource);

        // text selection requires the value to be wrapped in another element
        const forceWrapper = this.beans.gridOptionsWrapper.isEnableCellTextSelection();

        this.cellComp.setIncludeSelection(this.includeSelection);
        this.cellComp.setIncludeDndSource(this.includeDndSource);
        this.cellComp.setIncludeRowDrag(this.includeRowDrag);
        this.cellComp.setForceWrapper(forceWrapper);
    }

    private isIncludeControl(value: boolean | Function | undefined): boolean {
        const rowNodePinned = this.rowNode.rowPinned != null;
        const isFunc = typeof value === 'function';
        const res = rowNodePinned ? false : isFunc || value === true;
        return res;
    }

    public refreshShouldDestroy(): boolean {
        const colDef = this.column.getColDef();

        const selectionChanged = this.includeSelection != this.isIncludeControl(colDef.checkboxSelection);
        const rowDragChanged = this.includeRowDrag != this.isIncludeControl(colDef.rowDrag);
        const dndSourceChanged = this.includeDndSource != this.isIncludeControl(colDef.dndSource);

        return selectionChanged || rowDragChanged || dndSourceChanged;
    }

    // either called internally if single cell editing, or called by rowRenderer if row editing
    public startEditing(keyPress: number | null = null, charPress: string | null = null, cellStartedEdit = false): void {
        if (!this.isCellEditable() || this.editing) { return; }

        this.setEditing(true);

        const editorParams = this.createCellEditorParams(keyPress, charPress, cellStartedEdit);
        const compAndParams = this.beans.userComponentFactory.getCellEditorDetails(this.colDef, editorParams);
        this.cellComp.editValue(compAndParams!);

        const event: CellEditingStartedEvent = this.createEvent(null, Events.EVENT_CELL_EDITING_STARTED);
        this.beans.eventService.dispatchEvent(event);
    }

    private setEditing(editing: boolean): void {
        if (this.editing === editing) { return; }
        this.editing = editing;
        this.setInlineEditingClass();
    }

    // pass in 'true' to cancel the editing.
    public stopRowOrCellEdit(cancel: boolean = false) {
        if (this.beans.gridOptionsWrapper.isFullRowEdit()) {
            this.rowCtrl!.stopRowEditing(cancel);
        } else {
            this.stopEditing(cancel);
        }
    }

    private takeValueFromCellEditor(cancel: boolean): { newValue?: any, newValueExists: boolean } {
        const noValueResult = { newValueExists: false };

        if (cancel) { return noValueResult; }
        const cellEditor =  this.cellComp.getCellEditor();
        if (!cellEditor) { return noValueResult; }

        const userWantsToCancel = cellEditor.isCancelAfterEnd && cellEditor.isCancelAfterEnd();
        if (userWantsToCancel) { return noValueResult; }

        const newValue = cellEditor.getValue();

        return {
            newValue: newValue,
            newValueExists: true
        };
    }

    private saveNewValue(oldValue: any, newValue: any): void {
        if (newValue !== oldValue) {
            // we suppressRefreshCell because the call to rowNode.setDataValue() results in change detection
            // getting triggered, which results in all cells getting refreshed. we do not want this refresh
            // to happen on this call as we want to call it explicitly below. otherwise refresh gets called twice.
            // if we only did this refresh (and not the one below) then the cell would flash and not be forced.
            this.suppressRefreshCell = true;
            this.rowNode.setDataValue(this.column, newValue);
            this.suppressRefreshCell = false;
        }
    }

    public stopEditing(cancel = false): void {
        if (!this.editing) { return; }

        const {newValue, newValueExists} = this.takeValueFromCellEditor(cancel);

        const oldValue = this.getValueFromValueService();

        if (newValueExists) {
            this.saveNewValue(oldValue, newValue);
        }

        this.setEditing(false);
        this.updateAndFormatValue();
        this.refreshCell({ forceRefresh: true, suppressFlash: true });

        this.dispatchEditingStoppedEvent(oldValue, newValue);
    }

    private dispatchEditingStoppedEvent(oldValue: any, newValue: any): void {
        const editingStoppedEvent = {
            ...this.createEvent(null, Events.EVENT_CELL_EDITING_STOPPED),
            oldValue,
            newValue
        };

        this.beans.eventService.dispatchEvent(editingStoppedEvent);
    }

    // if we are editing inline, then we don't have the padding in the cell (set in the themes)
    // to allow the text editor full access to the entire cell
    private setInlineEditingClass(): void {
        if (!this.isAlive()) { return; }

        // ag-cell-inline-editing - appears when user is inline editing
        // ag-cell-not-inline-editing - appears when user is no inline editing
        // ag-cell-popup-editing - appears when user is editing cell in popup (appears on the cell, not on the popup)

        // note: one of {ag-cell-inline-editing, ag-cell-not-inline-editing} is always present, they toggle.
        //       however {ag-cell-popup-editing} shows when popup, so you have both {ag-cell-popup-editing}
        //       and {ag-cell-not-inline-editing} showing at the same time.

        ///////// FIX FIX FIX FIX for popup

        // const editingInline = this.editing && !this.cellEditorInPopup;
        // const popupEditorShowing = this.editing && this.cellEditorInPopup;
        const editingInline = this.editing;
        const popupEditorShowing = false;

        this.cellComp.addOrRemoveCssClass(CSS_CELL_INLINE_EDITING, editingInline);
        this.cellComp.addOrRemoveCssClass(CSS_CELL_NOT_INLINE_EDITING, !editingInline);
        this.cellComp.addOrRemoveCssClass(CSS_CELL_POPUP_EDITING, popupEditorShowing);

        if (this.rowCtrl) {
            this.rowCtrl.setInlineEditingCss(this.editing);
        }
    }

    private createCellEditorParams(keyPress: number | null, charPress: string | null, cellStartedEdit: boolean): ICellEditorParams {
        return {
            value: this.getValueFromValueService(),
            keyPress: keyPress,
            charPress: charPress,
            column: this.column,
            colDef: this.column.getColDef(),
            rowIndex: this.getCellPosition().rowIndex,
            node: this.rowNode,
            data: this.rowNode.data,
            api: this.beans.gridOptionsWrapper.getApi(),
            cellStartedEdit: cellStartedEdit,
            columnApi: this.beans.gridOptionsWrapper.getColumnApi(),
            context: this.beans.gridOptionsWrapper.getContext(),
            $scope: this.scope,
            onKeyDown: this.onKeyDown.bind(this),
            stopEditing: this.stopEditingAndFocus.bind(this),
            eGridCell: this.getGui(),
            parseValue: this.parseValue.bind(this),
            formatValue: this.formatValue.bind(this)
        };
    }

    private createCellRendererParams(): ICellRendererParams {
        const addRowCompListener = this.rowCtrl ? (eventType: string, listener: Function) => {
            console.warn('AG Grid: since AG Grid v26, params.addRowCompListener() is deprecated. If you need this functionality, please contact AG Grid support and advise why so that we can revert with an appropriate workaround, as we dont have any valid use cases for it. This method was originally provided as a work around to know when cells were destroyed in AG Grid before custom Cell Renderers could be provided.');
            this.rowCtrl!.addEventListener(eventType, listener);
        } : null;

        return {
            value: this.value,
            valueFormatted: this.valueFormatted,
            getValue: this.getValueFromValueService.bind(this),
            setValue: value => this.beans.valueService.setValue(this.rowNode, this.column, value),
            formatValue: this.formatValue.bind(this),
            data: this.rowNode.data,
            node: this.rowNode,
            colDef: this.column.getColDef(),
            column: this.column,
            $scope: this.scope,
            rowIndex: this.getCellPosition().rowIndex,
            api: this.beans.gridOptionsWrapper.getApi(),
            columnApi: this.beans.gridOptionsWrapper.getColumnApi(),
            context: this.beans.gridOptionsWrapper.getContext(),
            refreshCell: this.refreshCell.bind(this),
            eGridCell: this.getGui(),
            eParentOfValue: this.cellComp.getParentOfValue(),

            registerRowDragger: (rowDraggerElement, dragStartPixels) => this.cellComp.addRowDragging(rowDraggerElement, dragStartPixels),

            // this function is not documented anywhere, so we could drop it
            // it was in the olden days to allow user to register for when rendered
            // row was removed (the row comp was removed), however now that the user
            // can provide components for cells, the destroy method gets call when this
            // happens so no longer need to fire event.
            addRowCompListener: addRowCompListener
        } as ICellRendererParams;
    }

    private parseValue(newValue: any): any {
        const colDef = this.column.getColDef();
        const params: NewValueParams = {
            node: this.rowNode,
            data: this.rowNode.data,
            oldValue: this.getValue(),
            newValue: newValue,
            colDef: colDef,
            column: this.column,
            api: this.beans.gridOptionsWrapper.getApi(),
            columnApi: this.beans.gridOptionsWrapper.getColumnApi(),
            context: this.beans.gridOptionsWrapper.getContext()
        };

        const valueParser = colDef.valueParser;

        return exists(valueParser) ? this.beans.expressionService.evaluate(valueParser, params) : newValue;
    }

    public setFocusOutOnEditor(): void {
        if (!this.editing) { return; }
        const cellEditor = this.cellComp.getCellEditor();
        if (cellEditor && cellEditor.focusOut) {
            cellEditor.focusOut();
        }
    }

    public setFocusInOnEditor(): void {
        if (!this.editing) { return; }
        const cellEditor = this.cellComp.getCellEditor();

        if (cellEditor && cellEditor.focusIn) {
            // if the editor is present, then we just focus it
            cellEditor.focusIn();
        } else {
            // if the editor is not present, it means async cell editor (eg React fibre)
            // and we are trying to set focus before the cell editor is present, so we
            // focus the cell instead
            this.focusCell(true);
        }
    }

    public onCellChanged(event: CellChangedEvent): void {
        const eventImpactsThisCell = event.column === this.column;
        if (eventImpactsThisCell) {
            this.refreshCell({});
        }
    }

    // + stop editing {forceRefresh: true, suppressFlash: true}
    // + event cellChanged {}
    // + cellRenderer.params.refresh() {} -> method passes 'as is' to the cellRenderer, so params could be anything
    // + rowCtrl: event dataChanged {suppressFlash: !update, newData: !update}
    // + rowCtrl: api refreshCells() {animate: true/false}
    // + rowRenderer: api softRefreshView() {}
    public refreshCell(params?: { suppressFlash?: boolean, newData?: boolean, forceRefresh?: boolean; }) {
        // if we are in the middle of 'stopEditing', then we don't refresh here, as refresh gets called explicitly
        if (this.suppressRefreshCell || this.editing) { return; }

        const colDef = this.column.getColDef();
        const newData = params != null && !!params.newData;
        const suppressFlash = (params != null && !!params.suppressFlash) || !!colDef.suppressCellFlash;
        // we always refresh if cell has no value - this can happen when user provides Cell Renderer and the
        // cell renderer doesn't rely on a value, instead it could be looking directly at the data, or maybe
        // printing the current time (which would be silly)???. Generally speaking
        // non of {field, valueGetter, showRowGroup} is bad in the users application, however for this edge case, it's
        // best always refresh and take the performance hit rather than never refresh and users complaining in support
        // that cells are not updating.
        const noValueProvided = colDef.field == null && colDef.valueGetter == null && colDef.showRowGroup == null;
        const forceRefresh = (params && params.forceRefresh) || noValueProvided || newData;

        const valuesDifferent = this.updateAndFormatValue();
        const dataNeedsUpdating = forceRefresh || valuesDifferent;

        if (dataNeedsUpdating) {

            // if it's 'new data', then we don't refresh the cellRenderer, even if refresh method is available.
            // this is because if the whole data is new (ie we are showing stock price 'BBA' now and not 'SSD')
            // then we are not showing a movement in the stock price, rather we are showing different stock.
            this.showValue(newData);

            // we don't want to flash the cells when processing a filter change, as otherwise the UI would
            // be to busy. see comment in FilterManager with regards processingFilterChange
            const processingFilterChange = this.beans.filterManager.isSuppressFlashingCellsBecauseFiltering();

            const flashCell = !suppressFlash && !processingFilterChange &&
                (this.beans.gridOptionsWrapper.isEnableCellChangeFlash() || colDef.enableCellChangeFlash);

            if (flashCell) {
                this.flashCell();
            }

            this.cellCustomStyleFeature.applyUserStyles();
            this.cellCustomStyleFeature.applyClassesFromColDef();
        }

        // we can't readily determine if the data in an angularjs template has changed, so here we just update
        // and recompile (if applicable)

        // this.updateAngular1ScopeAndCompile();

        this.refreshToolTip();

        // we do cellClassRules even if the value has not changed, so that users who have rules that
        // look at other parts of the row (where the other part of the row might of changed) will work.
        this.cellCustomStyleFeature.applyCellClassRules();
    }

    // cell editors call this, when they want to stop for reasons other
    // than what we pick up on. eg selecting from a dropdown ends editing.
    public stopEditingAndFocus(suppressNavigateAfterEdit = false): void {
        this.stopRowOrCellEdit();
        this.focusCell(true);

        if (!suppressNavigateAfterEdit) {
            this.navigateAfterEdit();
        }
    }

    private navigateAfterEdit(): void {
        const fullRowEdit = this.beans.gridOptionsWrapper.isFullRowEdit();

        if (fullRowEdit) { return; }

        const enterMovesDownAfterEdit = this.beans.gridOptionsWrapper.isEnterMovesDownAfterEdit();

        if (enterMovesDownAfterEdit) {
            this.beans.navigationService.navigateToNextCell(null, KeyCode.DOWN, this.getCellPosition(), false);
        }
    }

    // user can also call this via API
    public flashCell(delays?: { flashDelay?: number | null; fadeDelay?: number | null; }): void {
        const flashDelay = delays && delays.flashDelay;
        const fadeDelay = delays && delays.fadeDelay;

        this.animateCell('data-changed', flashDelay, fadeDelay);
    }

    private animateCell(cssName: string, flashDelay?: number | null, fadeDelay?: number | null): void {
        const fullName = `ag-cell-${cssName}`;
        const animationFullName = `ag-cell-${cssName}-animation`;
        const { gridOptionsWrapper } = this.beans;

        if (!flashDelay) {
            flashDelay = gridOptionsWrapper.getCellFlashDelay();
        }

        if (!exists(fadeDelay)) {
            fadeDelay = gridOptionsWrapper.getCellFadeDelay();
        }

        // we want to highlight the cells, without any animation
        this.cellComp.addOrRemoveCssClass(fullName, true);
        this.cellComp.addOrRemoveCssClass(animationFullName, false);

        // then once that is applied, we remove the highlight with animation
        window.setTimeout(() => {
            this.cellComp.addOrRemoveCssClass(fullName, false);
            this.cellComp.addOrRemoveCssClass(animationFullName, true);

            this.cellComp.setTransition(`background-color ${fadeDelay}ms`);
            window.setTimeout(() => {
                // and then to leave things as we got them, we remove the animation
                this.cellComp.addOrRemoveCssClass(animationFullName, false);
                this.cellComp.setTransition('transition');
            }, fadeDelay!);
        }, flashDelay);
    }

    public onFlashCells(event: FlashCellsEvent): void {
        const cellId = this.beans.cellPositionUtils.createId(this.getCellPosition());
        const shouldFlash = event.cells[cellId];
        if (shouldFlash) {
            this.animateCell('highlight');
        }
    }

    public isCellEditable() {
        return this.column.isCellEditable(this.rowNode);
    }

    public formatValue(): void {
        this.valueFormatted = this.beans.valueFormatterService.formatValue(this.column, this.rowNode, this.scope, this.value);
    }

    public updateAndFormatValue(force = false): boolean {
        const oldValue = this.value;
        const oldValueFormatted = this.valueFormatted;

        this.value = this.getValueFromValueService();
        this.formatValue();

        const valuesDifferent = force ? true :
            !this.valuesAreEqual(oldValue, this.value) || this.valueFormatted != oldValueFormatted;

        return valuesDifferent;
    }

    private valuesAreEqual(val1: any, val2: any): boolean {
        // if the user provided an equals method, use that, otherwise do simple comparison
        const colDef = this.column.getColDef();
        return colDef.equals ? colDef.equals(val1, val2) : val1 === val2;
    }

    public getComp(): ICellComp {
        return this.cellComp;
    }

    public getValueFromValueService(): any {
        // if we don't check this, then the grid will render leaf groups as open even if we are not
        // allowing the user to open leaf groups. confused? remember for pivot mode we don't allow
        // opening leaf groups, so we have to force leafGroups to be closed in case the user expanded
        // them via the API, or user user expanded them in the UI before turning on pivot mode
        const lockedClosedGroup = this.rowNode.leafGroup && this.beans.columnModel.isPivotMode();

        const isOpenGroup = this.rowNode.group && this.rowNode.expanded && !this.rowNode.footer && !lockedClosedGroup;

        // are we showing group footers
        const groupFootersEnabled = this.beans.gridOptionsWrapper.isGroupIncludeFooter();

        // if doing footers, we normally don't show agg data at group level when group is open
        const groupAlwaysShowAggData = this.beans.gridOptionsWrapper.isGroupSuppressBlankHeader();

        // if doing grouping and footers, we don't want to include the agg value
        // in the header when the group is open
        const ignoreAggData = (isOpenGroup && groupFootersEnabled) && !groupAlwaysShowAggData;

        const value = this.beans.valueService.getValue(this.column, this.rowNode, false, ignoreAggData);

        return value;
    }

    public getValue(): any {
        return this.value;
    }

    public getValueFormatted(): string {
        return this.valueFormatted;
    }

    private addDomData(): void {
        const element = this.getGui();
        this.beans.gridOptionsWrapper.setDomData(element, CellCtrl.DOM_DATA_KEY_CELL_CTRL, this);

        this.addDestroyFunc(() => this.beans.gridOptionsWrapper.setDomData(element, CellCtrl.DOM_DATA_KEY_CELL_CTRL, null));
    }

    public createEvent(domEvent: Event | null, eventType: string): CellEvent {
        const event: CellEvent = {
            type: eventType,
            node: this.rowNode,
            data: this.rowNode.data,
            value: this.value,
            column: this.column,
            colDef: this.column.getColDef(),
            context: this.beans.gridOptionsWrapper.getContext(),
            api: this.beans.gridApi,
            columnApi: this.beans.columnApi,
            rowPinned: this.rowNode.rowPinned,
            event: domEvent,
            rowIndex: this.rowNode.rowIndex!
        };

        // because we are hacking in $scope for angular 1, we have to de-reference
        if (this.scope) {
            (event as any).$scope = this.scope;
        }

        return event;
    }

    public onKeyPress(event: KeyboardEvent): void {
        this.cellKeyboardListenerFeature.onKeyPress(event);
    }

    public onKeyDown(event: KeyboardEvent): void {
        this.cellKeyboardListenerFeature.onKeyDown(event);
    }

    public onMouseEvent(eventName: string, mouseEvent: MouseEvent): void {
        this.cellMouseListenerFeature.onMouseEvent(eventName, mouseEvent);
    }

    public getGui(): HTMLElement {
        return this.eGui;
    }

    public refreshToolTip(): void {
        this.cellTooltipFeature.refreshToolTip();
    }

    public getColSpanningList(): Column[] {
        return this.cellPositionFeature.getColSpanningList();
    }

    public onLeftChanged(): void {
        this.cellPositionFeature.onLeftChanged();
        this.refreshAriaIndex(); // should change this to listen for when column order changes
    }

    private refreshAriaIndex(): void {
        const colIdx = this.beans.columnModel.getAriaColumnIndex(this.column);
        this.cellComp.setAriaColIndex(colIdx);
    }

    public isSuppressNavigable(): boolean {
        return this.column.isSuppressNavigable(this.rowNode);
    }

    public onWidthChanged(): void {
        return this.cellPositionFeature.onWidthChanged();
    }

    public getColumn(): Column {
        return this.column;
    }

    public getRowNode(): RowNode {
        return this.rowNode;
    }

    public getBeans(): Beans {
        return this.beans;
    }

    public isPrintLayout(): boolean {
        return this.printLayout;
    }

    public appendChild(htmlElement: HTMLElement): void {
        this.eGui.appendChild(htmlElement);
    }

    public refreshHandle(): void {
        if (this.cellRangeFeature) {
            this.cellRangeFeature.refreshHandle();
        }
    }

    public getCellPosition(): CellPosition {
        return this.cellPosition;
    }

    public isEditing(): boolean {
        return this.editing;
    }

    // called by rowRenderer when user navigates via tab key
    public startRowOrCellEdit(keyPress?: number | null, charPress?: string | null): void {
        if (this.beans.gridOptionsWrapper.isFullRowEdit()) {
            this.rowCtrl!.startRowEditing(keyPress, charPress, this);
        } else {
            this.startEditing(keyPress, charPress, true);
        }
    }

    public getRowCtrl(): RowCtrl | null {
        return this.rowCtrl;
    }

    public getRowPosition(): RowPosition {
        return {
            rowIndex: this.cellPosition.rowIndex,
            rowPinned: this.cellPosition.rowPinned
        };
    }

    public updateRangeBordersIfRangeCount(): void {
        if (this.cellRangeFeature) {
            this.cellRangeFeature.updateRangeBordersIfRangeCount();
        }
    }

    public onRangeSelectionChanged(): void {
        if (this.cellRangeFeature) {
            this.cellRangeFeature.onRangeSelectionChanged();
        }
    }

    public isRangeSelectionEnabled(): boolean {
        return this.cellRangeFeature != null;
    }

    public focusCell(forceBrowserFocus = false): void {
        this.beans.focusService.setFocusedCell(this.getCellPosition().rowIndex, this.column, this.rowNode.rowPinned, forceBrowserFocus);
    }

    public onRowIndexChanged(): void {
        // when index changes, this influences items that need the index, so we update the
        // grid cell so they are working off the new index.
        this.createCellPosition();
        // when the index of the row changes, ie means the cell may have lost or gained focus
        this.onCellFocused();
        // check range selection
        if (this.cellRangeFeature) {
            this.cellRangeFeature.onRangeSelectionChanged();
        }
    }

    public onFirstRightPinnedChanged(): void {
        if (!this.cellComp) { return; }
        const firstRightPinned = this.column.isFirstRightPinned();
        this.cellComp.addOrRemoveCssClass(CSS_CELL_FIRST_RIGHT_PINNED, firstRightPinned);
    }

    public onLastLeftPinnedChanged(): void {
        if (!this.cellComp) { return; }
        const lastLeftPinned = this.column.isLastLeftPinned();
        this.cellComp.addOrRemoveCssClass(CSS_CELL_LAST_LEFT_PINNED, lastLeftPinned);
    }

    public onCellFocused(event?: CellFocusedEvent): void {
        if (!this.cellComp) { return; }
        const cellFocused = this.beans.focusService.isCellFocused(this.cellPosition);

        if (!this.gow.isSuppressCellSelection()) {
            this.cellComp.addOrRemoveCssClass(CSS_CELL_FOCUS, cellFocused);
        }

        // see if we need to force browser focus - this can happen if focus is programmatically set
        if (cellFocused && event && event.forceBrowserFocus) {
            const focusEl = this.cellComp.getFocusableElement();
            focusEl.focus();
            // Fix for AG-3465 "IE11 - After editing cell's content, selection doesn't go one cell below on enter"
            // IE can fail to focus the cell after the first call to focus(), and needs a second call
            if (!document.activeElement || document.activeElement === document.body) {
                focusEl.focus();
            }
        }

        // if another cell was focused, and we are editing, then stop editing
        const fullRowEdit = this.beans.gridOptionsWrapper.isFullRowEdit();

        if (!cellFocused && !fullRowEdit && this.editing) {
            this.stopRowOrCellEdit();
        }
    }

    private createCellPosition(): void {
        this.cellPosition = {
            rowIndex: this.rowNode.rowIndex!,
            rowPinned: this.rowNode.rowPinned,
            column: this.column
        };
    }

    // CSS Classes that only get applied once, they never change
    private applyStaticCssClasses(): void {
        this.cellComp.addOrRemoveCssClass(CSS_CELL, true);
        this.cellComp.addOrRemoveCssClass(CSS_CELL_NOT_INLINE_EDITING, true);

        // if we are putting the cell into a dummy container, to work out it's height,
        // then we don't put the height css in, as we want cell to fit height in that case.
        if (!this.autoHeightCell) {
            this.cellComp.addOrRemoveCssClass(CSS_AUTO_HEIGHT, true);
        }

        const wrapText = this.column.getColDef().wrapText == true;
        if (wrapText) {
            this.cellComp.addOrRemoveCssClass(CSS_CELL_WRAP_TEXT, true);
        }
    }

    public onColumnHover(): void {
        if (!this.cellComp) { return; }
        const isHovered = this.beans.columnHoverService.isHovered(this.column);
        this.cellComp.addOrRemoveCssClass(CSS_COLUMN_HOVER, isHovered);
    }

    public onNewColumnsLoaded(): void {
        if (!this.cellComp) { return; }
        this.postProcessWrapText();
        this.cellCustomStyleFeature.applyCellClassRules();
    }

    private postProcessWrapText(): void {
        const value = this.column.getColDef().wrapText == true;
        this.cellComp.addOrRemoveCssClass(CSS_CELL_WRAP_TEXT, value);
    }

    public dispatchCellContextMenuEvent(event: Event | null) {
        const colDef = this.column.getColDef();
        const cellContextMenuEvent: CellContextMenuEvent = this.createEvent(event, Events.EVENT_CELL_CONTEXT_MENU);
        this.beans.eventService.dispatchEvent(cellContextMenuEvent);

        if (colDef.onCellContextMenu) {
            // to make the callback async, do in a timeout
            window.setTimeout(() => (colDef.onCellContextMenu as any)(cellContextMenuEvent), 0);
        }
    }

    public getCellRenderer(): ICellRenderer | null {
        return this.cellComp ? this.cellComp.getCellRenderer() : null;
    }

    public getCellEditor(): ICellEditor | null {
        return this.cellComp ? this.cellComp.getCellEditor() : null;
    }

    public destroy(): void {
        if (this.cellRangeFeature) { this.cellRangeFeature.destroy(); }
    }
}