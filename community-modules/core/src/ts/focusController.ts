import { Bean, Autowired, PostConstruct, Optional } from "./context/context";
import { BeanStub } from "./context/beanStub";
import { Column } from "./entities/column";
import { CellFocusedEvent, Events } from "./events";
import { GridOptionsWrapper } from "./gridOptionsWrapper";
import { ColumnApi } from "./columnController/columnApi";
import { ColumnController } from "./columnController/columnController";
import { CellPosition } from "./entities/cellPosition";
import { RowNode } from "./entities/rowNode";
import { GridApi } from "./gridApi";
import { CellComp } from "./rendering/cellComp";
import { HeaderRowComp } from "./headerRendering/headerRowComp";
import { AbstractHeaderWrapper } from "./headerRendering/header/abstractHeaderWrapper";
import { HeaderPosition } from "./headerRendering/header/headerPosition";
import { RowPositionUtils } from "./entities/rowPosition";
import { IRangeController } from "./interfaces/iRangeController";
import { RowRenderer } from "./rendering/rowRenderer";
import { HeaderNavigationService } from "./headerRendering/header/headerNavigationService";
import { ColumnGroup } from "./entities/columnGroup";
import { ManagedFocusComponent } from "./widgets/managedFocusComponent";
import { GridCore } from "./gridCore";
import { getTabIndex } from './utils/browser';
import { findIndex, last } from './utils/array';
import { makeNull } from './utils/generic';

@Bean('focusController')
export class FocusController extends BeanStub {

    @Autowired('gridOptionsWrapper') private readonly gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('columnController') private readonly columnController: ColumnController;
    @Autowired('headerNavigationService') private readonly headerNavigationService: HeaderNavigationService;
    @Autowired('columnApi') private readonly columnApi: ColumnApi;
    @Autowired('gridApi') private readonly gridApi: GridApi;
    @Autowired('rowRenderer') private readonly rowRenderer: RowRenderer;
    @Autowired('rowPositionUtils') private readonly rowPositionUtils: RowPositionUtils;
    @Optional('rangeController') private readonly rangeController: IRangeController;

    private static FOCUSABLE_SELECTOR = '[tabindex], input, select, button, textarea';
    private static FOCUSABLE_EXCLUDE = '.ag-hidden, .ag-hidden *, .ag-disabled, .ag-disabled *';

    private gridCore: GridCore;
    private focusedCellPosition: CellPosition | null;
    private focusedHeaderPosition: HeaderPosition | null;
    private keyboardFocusActive: boolean = false;

    @PostConstruct
    private init(): void {
        const eDocument = this.gridOptionsWrapper.getDocument();

        const clearFocusedCellListener = this.clearFocusedCell.bind(this);

        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_MODE_CHANGED, clearFocusedCellListener);
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_EVERYTHING_CHANGED, this.onColumnEverythingChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_GROUP_OPENED, clearFocusedCellListener);
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, clearFocusedCellListener);

        this.addManagedListener(eDocument, 'keydown', this.activateKeyboardMode.bind(this));
        this.addManagedListener(eDocument, 'mousedown', this.activateMouseMode.bind(this));
    }

    public registerGridCore(gridCore: GridCore): void {
        this.gridCore = gridCore;
    }

    public onColumnEverythingChanged(): void {
        // if the columns change, check and see if this column still exists. if it does,
        // then we can keep the focused cell. if it doesn't, then we need to drop the focused
        // cell.
        if (this.focusedCellPosition) {
            const col = this.focusedCellPosition.column;
            const colFromColumnController = this.columnController.getGridColumn(col.getId());

            if (col !== colFromColumnController) {
                this.clearFocusedCell();
            }
        }
    }

    public isKeyboardFocus(): boolean {
        return this.keyboardFocusActive;
    }

    private activateMouseMode(): void {
        if (!this.keyboardFocusActive) { return; }

        this.keyboardFocusActive = false;
        this.eventService.dispatchEvent({ type: Events.EVENT_MOUSE_FOCUS });
    }

    private activateKeyboardMode(): void {
        if (this.keyboardFocusActive) { return; }

        this.keyboardFocusActive = true;
        this.eventService.dispatchEvent({ type: Events.EVENT_KEYBOARD_FOCUS });
    }

    // we check if the browser is focusing something, and if it is, and
    // it's the cell we think is focused, then return the cell. so this
    // methods returns the cell if a) we think it has focus and b) the
    // browser thinks it has focus. this then returns nothing if we
    // first focus a cell, then second click outside the grid, as then the
    // grid cell will still be focused as far as the grid is concerned,
    // however the browser focus will have moved somewhere else.
    public getFocusCellToUseAfterRefresh(): CellPosition | null {
        if (this.gridOptionsWrapper.isSuppressFocusAfterRefresh() || !this.focusedCellPosition) {
            return null;
        }

        // we check that the browser is actually focusing on the grid, if it is not, then
        // we have nothing to worry about
        if (!this.getGridCellForDomElement(document.activeElement)) {
            return null;
        }

        return this.focusedCellPosition;
    }

    private getGridCellForDomElement(eBrowserCell: Node | null): CellPosition | null {
        let ePointer = eBrowserCell;

        while (ePointer) {
            const cellComp = this.gridOptionsWrapper.getDomData(ePointer, CellComp.DOM_DATA_KEY_CELL_COMP) as CellComp;

            if (cellComp) {
                return cellComp.getCellPosition();
            }

            ePointer = ePointer.parentNode;
        }

        return null;
    }

    public clearFocusedCell(): void {
        this.focusedCellPosition = null;
        this.onCellFocused(false);
    }

    public getFocusedCell(): CellPosition | null {
        return this.focusedCellPosition;
    }

    public setFocusedCell(rowIndex: number, colKey: string | Column, floating: string | null | undefined, forceBrowserFocus = false): void {
        const gridColumn = this.columnController.getGridColumn(colKey);

        // if column doesn't exist, then blank the focused cell and return. this can happen when user sets new columns,
        // and the focused cell is in a column that no longer exists. after columns change, the grid refreshes and tries
        // to re-focus the focused cell.
        if (!gridColumn) {
            this.focusedCellPosition = null;
            return;
        }

        this.focusedCellPosition = gridColumn ? { rowIndex, rowPinned: makeNull(floating), column: gridColumn } : null;
        this.onCellFocused(forceBrowserFocus);
    }

    public isCellFocused(cellPosition: CellPosition): boolean {
        if (this.focusedCellPosition == null) { return false; }

        return this.focusedCellPosition.column === cellPosition.column &&
            this.isRowFocused(cellPosition.rowIndex, cellPosition.rowPinned);
    }

    public isRowNodeFocused(rowNode: RowNode): boolean {
        return this.isRowFocused(rowNode.rowIndex!, rowNode.rowPinned);
    }

    public isHeaderWrapperFocused(headerWrapper: AbstractHeaderWrapper): boolean {
        if (this.focusedHeaderPosition == null) { return false; }

        const column = headerWrapper.getColumn();
        const headerRowIndex = (headerWrapper.getParentComponent() as HeaderRowComp).getRowIndex();
        const pinned = headerWrapper.getPinned();

        const { column: focusedColumn, headerRowIndex: focusedHeaderRowIndex } = this.focusedHeaderPosition;

        return column === focusedColumn &&
            headerRowIndex === focusedHeaderRowIndex &&
            pinned == focusedColumn.getPinned();
    }

    public clearFocusedHeader(): void {
        this.focusedHeaderPosition = null;
    }

    public getFocusedHeader(): HeaderPosition | null {
        return this.focusedHeaderPosition;
    }

    public setFocusedHeader(headerRowIndex: number, column: ColumnGroup | Column): void {
        this.focusedHeaderPosition = { headerRowIndex, column };
    }

    public focusHeaderPosition(
        headerPosition: HeaderPosition | null,
        direction: 'Before' | 'After' | undefined | null = null,
        fromTab: boolean = false,
        allowUserOverride: boolean = false,
        event?: KeyboardEvent
    ): boolean {
        if (allowUserOverride) {
            const { gridOptionsWrapper } = this;
            const currentPosition = this.getFocusedHeader();
            const headerRowCount = this.headerNavigationService.getHeaderRowCount();

            if (fromTab) {
                const userFunc = gridOptionsWrapper.getTabToNextHeaderFunc();
                if (userFunc) {
                    const params = {
                        backwards: direction === 'Before',
                        previousHeaderPosition: currentPosition,
                        nextHeaderPosition: headerPosition,
                        headerRowCount
                    };
                    headerPosition = userFunc(params);
                }
            } else {
                const userFunc = gridOptionsWrapper.getNavigateToNextHeaderFunc();
                if (userFunc && event) {
                    const params = {
                        key: event.key,
                        previousHeaderPosition: currentPosition,
                        nextHeaderPosition: headerPosition,
                        headerRowCount,
                        event
                    };
                    headerPosition = userFunc(params);
                }
            }
        }

        if (!headerPosition) { return false; }

        if (headerPosition.headerRowIndex === -1) {
            return this.focusGridView(headerPosition.column as Column);
        }

        this.headerNavigationService.scrollToColumn(headerPosition.column, direction);

        const childContainer = this.headerNavigationService.getHeaderContainer(headerPosition.column.getPinned());
        const rowComps = childContainer!.getRowComps();
        const nextRowComp = rowComps[headerPosition.headerRowIndex];
        const headerComps = nextRowComp.getHeaderComps();
        const nextHeader = headerComps[headerPosition.column.getUniqueId()];

        if (nextHeader) {
            // this will automatically call the setFocusedHeader method above
            nextHeader.getFocusableElement().focus();
            return true;
        }

        return false;
    }

    public isAnyCellFocused(): boolean {
        return !!this.focusedCellPosition;
    }

    public isRowFocused(rowIndex: number, floating?: string | null): boolean {
        if (this.focusedCellPosition == null) { return false; }

        return this.focusedCellPosition.rowIndex === rowIndex && this.focusedCellPosition.rowPinned === makeNull(floating);
    }

    public findFocusableElements(rootNode: HTMLElement, exclude?: string | null, onlyUnmanaged = false): HTMLElement[] {
        const focusableString = FocusController.FOCUSABLE_SELECTOR;
        let excludeString = FocusController.FOCUSABLE_EXCLUDE;

        if (exclude) {
            excludeString += ', ' + exclude;
        }

        if (onlyUnmanaged) {
            excludeString += ', [tabindex="-1"]';
        }

        const nodes = Array.prototype.slice.apply(rootNode.querySelectorAll(focusableString)) as HTMLElement[];
        const excludeNodes = Array.prototype.slice.apply(rootNode.querySelectorAll(excludeString)) as HTMLElement[];

        if (!excludeNodes.length) {
            return nodes;
        }

        const diff = (a: HTMLElement[], b: HTMLElement[]) => a.filter(element => b.indexOf(element) === -1);
        return diff(nodes, excludeNodes);
    }

    public focusInto(rootNode: HTMLElement, up = false, onlyUnmanaged = false): boolean {
        const focusableElements = this.findFocusableElements(rootNode, null, onlyUnmanaged);
        const toFocus = up ? last(focusableElements) : focusableElements[0];

        if (toFocus) {
            toFocus.focus();
            return true;
        }

        return false;
    }

    public findNextFocusableElement(rootNode: HTMLElement, onlyManaged?: boolean | null, backwards?: boolean): HTMLElement | null {
        const focusable = this.findFocusableElements(rootNode, onlyManaged ? ':not([tabindex="-1"])' : null);
        let currentIndex: number;

        if (onlyManaged) {
            currentIndex = findIndex(focusable, el => el.contains(document.activeElement));
        } else {
            currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
        }

        const nextIndex = currentIndex + (backwards ? -1 : 1);

        if (nextIndex < 0 || nextIndex >= focusable.length) {
            return null;
        }

        return focusable[nextIndex];
    }

    public isFocusUnderManagedComponent(rootNode: HTMLElement): boolean {
        const managedContainers = rootNode.querySelectorAll(`.${ManagedFocusComponent.FOCUS_MANAGED_CLASS}`);

        if (!managedContainers.length) { return false; }

        for (let i = 0; i < managedContainers.length; i++) {
            if (managedContainers[i].contains(document.activeElement)) {
                return true;
            }
        }

        return false;
    }

    public findTabbableParent(node: HTMLElement | null, limit: number = 5): HTMLElement | null {
        let counter = 0;

        while (node && getTabIndex(node) === null && ++counter <= limit) {
            node = node.parentElement;
        }

        if (getTabIndex(node) === null) { return null; }

        return node;
    }

    private onCellFocused(forceBrowserFocus: boolean): void {
        const event: CellFocusedEvent = {
            type: Events.EVENT_CELL_FOCUSED,
            forceBrowserFocus: forceBrowserFocus,
            rowIndex: null,
            column: null,
            floating: null,
            api: this.gridApi,
            columnApi: this.columnApi,
            rowPinned: null
        };

        if (this.focusedCellPosition) {
            event.rowIndex = this.focusedCellPosition.rowIndex;
            event.column = this.focusedCellPosition.column;
            event.rowPinned = this.focusedCellPosition.rowPinned;
        }

        this.eventService.dispatchEvent(event);
    }

    public focusGridView(column?: Column, backwards?: boolean): boolean {
        const nextRow = backwards
            ? this.rowPositionUtils.getLastRow()
            : this.rowPositionUtils.getFirstRow();

        if (!nextRow) { return false; }

        const { rowIndex, rowPinned } = nextRow;
        const focusedHeader = this.getFocusedHeader();

        if (!column && focusedHeader) {
            column = focusedHeader.column as Column;
        }

        if (rowIndex == null || !column) { return false; }

        this.rowRenderer.ensureCellVisible({ rowIndex, column, rowPinned });

        this.setFocusedCell(rowIndex, column, makeNull(rowPinned), true);

        if (this.rangeController) {
            const cellPosition = { rowIndex, rowPinned, column };
            this.rangeController.setRangeToCell(cellPosition);
        }

        return true;
    }

    public focusNextGridCoreContainer(backwards: boolean): boolean {
        if (this.gridCore.focusNextInnerContainer(backwards)) {
            return true;
        }

        if (!backwards) {
            this.gridCore.forceFocusOutOfContainer();
        }

        return false;
    }
}
