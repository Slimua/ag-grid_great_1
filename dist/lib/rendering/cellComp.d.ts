import { Column } from "../entities/column";
import { CellChangedEvent, RowNode } from "../entities/rowNode";
import { CellEvent, FlashCellsEvent } from "../events";
import { Beans } from "./beans";
import { Component } from "../widgets/component";
import { ICellEditorComp } from "../interfaces/iCellEditor";
import { ICellRendererComp } from "./cellRenderers/iCellRenderer";
import { ColDef } from "../entities/colDef";
import { CellPosition } from "../entities/cellPosition";
import { RowComp } from "./rowComp";
import { IFrameworkOverrides } from "../interfaces/iFrameworkOverrides";
export declare class CellComp extends Component {
    static DOM_DATA_KEY_CELL_COMP: string;
    private static CELL_RENDERER_TYPE_NORMAL;
    private static CELL_RENDERER_TYPE_PINNED;
    private eCellWrapper;
    private eParentOfValue;
    private beans;
    private column;
    private rowNode;
    private eParentRow;
    private cellPosition;
    private rangeCount;
    private hasChartRange;
    private usingWrapper;
    private includeSelectionComponent;
    private includeRowDraggingComponent;
    private includeDndSourceComponent;
    private cellFocused;
    private editingCell;
    private cellEditorInPopup;
    private hideEditorPopup;
    private lastIPadMouseClickEvent;
    private usingCellRenderer;
    private cellRendererType;
    private cellRenderer;
    private cellRendererGui;
    private cellEditor;
    private selectionHandle;
    private autoHeightCell;
    private firstRightPinned;
    private lastLeftPinned;
    private rowComp;
    private rangeSelectionEnabled;
    private value;
    private valueFormatted;
    private colsSpanning;
    private rowSpan;
    private suppressRefreshCell;
    private tooltip;
    private scope;
    private readonly printLayout;
    private cellEditorVersion;
    private cellRendererVersion;
    constructor(scope: any, beans: Beans, column: Column, rowNode: RowNode, rowComp: RowComp, autoHeightCell: boolean, printLayout: boolean);
    getCreateTemplate(): string;
    private getStylesForRowSpanning;
    afterAttached(): void;
    onColumnHover(): void;
    onCellChanged(event: CellChangedEvent): void;
    private getCellLeft;
    private getCellWidth;
    onFlashCells(event: FlashCellsEvent): void;
    private setupColSpan;
    getColSpanningList(): Column[];
    private onDisplayColumnsChanged;
    private getInitialCssClasses;
    getInitialValueToRender(): string;
    getRenderedRow(): RowComp;
    isSuppressNavigable(): boolean;
    getCellRenderer(): ICellRendererComp | null;
    getCellEditor(): ICellEditorComp | null;
    refreshCell(params?: {
        suppressFlash?: boolean;
        newData?: boolean;
        forceRefresh?: boolean;
    }): void;
    flashCell(): void;
    private animateCell;
    private replaceContentsAfterRefresh;
    private updateAngular1ScopeAndCompile;
    private angular1Compile;
    private postProcessStylesFromColDef;
    private preProcessStylesFromColDef;
    private processStylesFromColDef;
    private postProcessClassesFromColDef;
    private preProcessClassesFromColDef;
    private processClassesFromColDef;
    private putDataIntoCellAfterRefresh;
    attemptCellRendererRefresh(): boolean;
    private refreshToolTip;
    private valuesAreEqual;
    private getToolTip;
    getTooltipText(escape?: boolean): any;
    private processCellClassRules;
    private postProcessCellClassRules;
    private preProcessCellClassRules;
    setUsingWrapper(): void;
    private chooseCellRenderer;
    private createCellRendererInstance;
    private afterCellRendererCreated;
    private createCellRendererParams;
    private formatValue;
    private getValueToUse;
    private getValueAndFormat;
    private getValue;
    onMouseEvent(eventName: string, mouseEvent: MouseEvent): void;
    dispatchCellContextMenuEvent(event: Event): void;
    createEvent(domEvent: Event | null, eventType: string): CellEvent;
    private onMouseOut;
    private onMouseOver;
    private onCellDoubleClicked;
    startRowOrCellEdit(keyPress?: number | null, charPress?: string): void;
    isCellEditable(): boolean;
    startEditingIfEnabled(keyPress?: number | null, charPress?: string | null, cellStartedEdit?: boolean): void;
    private createCellEditor;
    private afterCellEditorCreated;
    private addInCellEditor;
    private addPopupCellEditor;
    private onPopupEditorClosed;
    private setInlineEditingClass;
    private createCellEditorParams;
    private stopEditingAndFocus;
    private parseValue;
    focusCell(forceBrowserFocus?: boolean): void;
    setFocusInOnEditor(): void;
    isEditing(): boolean;
    onKeyDown(event: KeyboardEvent): void;
    setFocusOutOnEditor(): void;
    private onNavigationKeyPressed;
    private onShiftRangeSelect;
    private onTabKeyDown;
    private onBackspaceOrDeleteKeyPressed;
    private onEnterKeyDown;
    private navigateAfterEdit;
    private onF2KeyDown;
    private onEscapeKeyDown;
    onKeyPress(event: KeyboardEvent): void;
    private onSpaceKeyPressed;
    private onMouseDown;
    private isDoubleClickOnIPad;
    private onCellClicked;
    private createGridCellVo;
    getCellPosition(): CellPosition;
    getParentRow(): HTMLElement;
    setParentRow(eParentRow: HTMLElement): void;
    getColumn(): Column;
    getComponentHolder(): ColDef;
    detach(): void;
    destroy(): void;
    onLeftChanged(): void;
    private modifyLeftForPrintLayout;
    onWidthChanged(): void;
    private getRangeBorders;
    private getInitialRangeClasses;
    onRowIndexChanged(): void;
    onRangeSelectionChanged(): void;
    private shouldHaveSelectionHandle;
    private addSelectionHandle;
    updateRangeBordersIfRangeCount(): void;
    private refreshHandle;
    private updateRangeBorders;
    onFirstRightPinnedChanged(): void;
    onLastLeftPinnedChanged(): void;
    private populateTemplate;
    protected getFrameworkOverrides(): IFrameworkOverrides;
    private addRowDragging;
    private addDndSource;
    private addSelectionCheckbox;
    private addDomData;
    onCellFocused(event?: any): void;
    stopRowOrCellEdit(cancel?: boolean): void;
    stopEditing(cancel?: boolean): void;
}
