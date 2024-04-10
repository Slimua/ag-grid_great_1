import { BrandedType } from "@ag-grid-community/core";
import { HorizontalDirection } from "../../../constants/direction";
import { BeanStub } from "../../../context/beanStub";
import { PostConstruct } from "../../../context/context";
import { DragSource } from "../../../dragAndDrop/dragAndDropService";
import { Column, ColumnPinnedType } from "../../../entities/column";
import { ColumnGroup } from "../../../entities/columnGroup";
import { ProvidedColumnGroup } from "../../../entities/providedColumnGroup";
import { Events } from "../../../eventKeys";
import { ColumnHeaderClickedEvent, ColumnHeaderContextMenuEvent } from "../../../events";
import { WithoutGridCommon } from "../../../interfaces/iCommon";
import { IHeaderColumn } from "../../../interfaces/iHeaderColumn";
import { Beans } from "../../../rendering/beans";
import { setAriaColIndex } from "../../../utils/aria";
import { getInnerWidth } from "../../../utils/dom";
import { isUserSuppressingHeaderKeyboardEvent } from "../../../utils/keyboard";
import { KeyCode } from "../.././../constants/keyCode";
import { HeaderRowCtrl } from "../../row/headerRowCtrl";
import { CssClassApplier } from "../cssClassApplier";

let instanceIdSequence = 0;

export interface IAbstractHeaderCellComp {
    addOrRemoveCssClass(cssClassName: string, on: boolean): void;
}

export interface IHeaderResizeFeature {
    toggleColumnResizing(resizing: boolean): void;
}

export type HeaderCellCtrlInstanceId = BrandedType<string, 'HeaderCellCtrlInstanceId'>;

export abstract class AbstractHeaderCellCtrl<TComp extends IAbstractHeaderCellComp = any, TColumn extends IHeaderColumn = any, TFeature extends IHeaderResizeFeature = any> extends BeanStub {

    public static DOM_DATA_KEY_HEADER_CTRL = 'headerCtrl';

    private instanceId: HeaderCellCtrlInstanceId;
    private columnGroupChild: IHeaderColumn;
    private parentRowCtrl: HeaderRowCtrl;

    private isResizing: boolean;
    private resizeToggleTimeout = 0;
    protected resizeMultiplier = 1;

    protected eGui: HTMLElement;
    protected resizeFeature: TFeature | null = null;
    protected comp: TComp;
    protected column: TColumn

    public lastFocusEvent: KeyboardEvent | null = null;

    protected dragSource: DragSource | null = null;

    protected abstract resizeHeader(delta: number, shiftKey: boolean): void;
    protected abstract moveHeader(direction: HorizontalDirection): void;

    constructor(columnGroupChild: IHeaderColumn, beans: Beans, parentRowCtrl: HeaderRowCtrl) {
        super();

        this.columnGroupChild = columnGroupChild;
        this.parentRowCtrl = parentRowCtrl;
        this.manualSetBeans(beans);

        // unique id to this instance, including the column ID to help with debugging in React as it's used in 'key'
        this.instanceId = columnGroupChild.getUniqueId() + '-' + instanceIdSequence++ as HeaderCellCtrlInstanceId;
    }

    @PostConstruct
    private postConstruct(): void {
        this.addManagedPropertyListeners(['suppressHeaderFocus'], () => this.refreshTabIndex());
    }

    protected shouldStopEventPropagation(e: KeyboardEvent): boolean {
        const { headerRowIndex, column } = this.beans.focusService.getFocusedHeader()!;

        return isUserSuppressingHeaderKeyboardEvent(
            this.beans.gos,
            e,
            headerRowIndex,
            column
        );
    }

    protected getWrapperHasFocus(): boolean {
        const activeEl = this.beans.gos.getActiveDomElement();

        return activeEl === this.eGui;
    }

    protected setGui(eGui: HTMLElement): void {
        this.eGui = eGui;
        this.addDomData();
        this.addManagedListener(this.beans.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.onDisplayedColumnsChanged.bind(this));
        this.onDisplayedColumnsChanged();
        this.refreshTabIndex();
    }

    protected onDisplayedColumnsChanged(): void {
        if (!this.comp || !this.column) { return; }
        this.refreshFirstAndLastStyles();
        this.refreshAriaColIndex();
    }

    private refreshFirstAndLastStyles(): void {
        const { comp, column, beans } = this;
        CssClassApplier.refreshFirstAndLastStyles(comp, (column as unknown as Column | ColumnGroup), beans.columnModel);
    }

    private refreshAriaColIndex(): void {
        const { beans, column } = this;

        const colIdx = beans.columnModel.getAriaColumnIndex(column as unknown as Column | ColumnGroup);
        setAriaColIndex(this.eGui, colIdx); // for react, we don't use JSX, as it slowed down column moving
    }

    protected addResizeAndMoveKeyboardListeners(): void {
        if (!this.resizeFeature) { return; }

        this.addManagedListener(this.eGui, 'keydown', this.onGuiKeyDown.bind(this));
        this.addManagedListener(this.eGui, 'keyup', this.onGuiKeyUp.bind(this));
    }

    private refreshTabIndex(): void {
        const suppressHeaderFocus = this.beans.gos.get('suppressHeaderFocus');
        if (suppressHeaderFocus) {
            this.eGui.removeAttribute('tabindex');
        } else {
            this.eGui.setAttribute('tabindex', '-1');
        }
    }

    private onGuiKeyDown(e: KeyboardEvent): void {
        const activeEl = this.beans.gos.getActiveDomElement();

        const isLeftOrRight = e.key === KeyCode.LEFT || e.key === KeyCode.RIGHT;

        if (this.isResizing) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (
            // if elements within the header are focused, we don't process the event
            activeEl !== this.eGui ||
            // if shiftKey and altKey are not pressed, it's cell navigation so we don't process the event
            (!e.shiftKey && !e.altKey)
        ) { return; }

        if (this.isResizing || isLeftOrRight) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (!isLeftOrRight) { return; }
        
        const isLeft = (e.key === KeyCode.LEFT) !== this.beans.gos.get('enableRtl');
        const direction = HorizontalDirection[isLeft ? 'Left' : 'Right' ];

        if (e.altKey) {
            this.isResizing = true;
            this.resizeMultiplier += 1;
            const diff = this.getViewportAdjustedResizeDiff(e);
            this.resizeHeader(diff, e.shiftKey);
            this.resizeFeature?.toggleColumnResizing(true);
        } else {
            this.moveHeader(direction);
        }
    }

    private getViewportAdjustedResizeDiff(e: KeyboardEvent): number {
        let diff = this.getResizeDiff(e);
        const { pinnedWidthService, ctrlsService } = this.beans;

        const pinned = this.column.getPinned();
        if (pinned) {
            const leftWidth = pinnedWidthService.getPinnedLeftWidth();
            const rightWidth = pinnedWidthService.getPinnedRightWidth();
            const bodyWidth = getInnerWidth(ctrlsService.getGridBodyCtrl().getBodyViewportElement()) - 50;

            if (leftWidth + rightWidth + diff > bodyWidth) {
                if (bodyWidth > leftWidth + rightWidth) {
                    // allow body width to ignore resize multiplier and fill space for last tick
                    diff = bodyWidth - leftWidth - rightWidth;
                } else {
                    return 0;
                }
            }
        }
        
        return diff;
    }

    private getResizeDiff(e: KeyboardEvent): number {
        let isLeft = (e.key === KeyCode.LEFT) !== this.beans.gos.get('enableRtl');

        const pinned = this.column.getPinned();
        const isRtl = this.beans.gos.get('enableRtl');
        if (pinned) {
            if (isRtl !== (pinned === 'right')) {
                isLeft = !isLeft;
            }
        }

        return (isLeft ? -1 : 1) * this.resizeMultiplier;
    }

    private onGuiKeyUp(): void {
        if (!this.isResizing) { return; }
        if (this.resizeToggleTimeout) {
            window.clearTimeout(this.resizeToggleTimeout);
            this.resizeToggleTimeout = 0;
        }

        this.isResizing = false;
        this.resizeMultiplier = 1;

        this.resizeToggleTimeout = setTimeout(() => {
            this.resizeFeature?.toggleColumnResizing(false);
        }, 150);
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        const wrapperHasFocus = this.getWrapperHasFocus();

        switch (e.key) {
            case KeyCode.PAGE_DOWN:
            case KeyCode.PAGE_UP:
            case KeyCode.PAGE_HOME:
            case KeyCode.PAGE_END:
                if (wrapperHasFocus) {
                    e.preventDefault();
                }
        }
    }

    private addDomData(): void {
        const key = AbstractHeaderCellCtrl.DOM_DATA_KEY_HEADER_CTRL;
        this.beans.gos.setDomData(this.eGui, key, this);
        this.addDestroyFunc(() => this.beans.gos.setDomData(this.eGui, key, null));
    }

    public getGui(): HTMLElement {
        return this.eGui;
    }

    public focus(event?: KeyboardEvent): boolean {
        if (!this.eGui) { return false; }

        this.lastFocusEvent = event || null;
        this.eGui.focus();
        return true;
    }

    public getRowIndex(): number {
        return this.parentRowCtrl.getRowIndex();
    }

    public getParentRowCtrl(): HeaderRowCtrl {
        return this.parentRowCtrl;
    }

    public getPinned(): ColumnPinnedType {
        return this.parentRowCtrl.getPinned();
    }

    public getInstanceId(): HeaderCellCtrlInstanceId {
        return this.instanceId;
    }

    public getColumnGroupChild(): IHeaderColumn {
        return this.columnGroupChild;
    }

    protected removeDragSource(): void {
        if (this.dragSource) {
            this.beans.dragAndDropService.removeDragSource(this.dragSource);
            this.dragSource = null;
        }
    }

    protected handleContextMenuMouseEvent(mouseEvent: MouseEvent | undefined, touchEvent: TouchEvent | undefined, column: Column | ProvidedColumnGroup): void {
        const event = mouseEvent ?? touchEvent!;
        const { gos, menuService } = this.beans;
        if (gos.get('preventDefaultOnContextMenu')) {
            event.preventDefault();
        }
        const columnToUse = column instanceof Column ? column : undefined;
        if (menuService.isHeaderContextMenuEnabled(columnToUse)) {
            menuService.showHeaderContextMenu(columnToUse, mouseEvent, touchEvent);
        }

        this.dispatchColumnMouseEvent(Events.EVENT_COLUMN_HEADER_CONTEXT_MENU, column);
    }

    protected dispatchColumnMouseEvent(eventType: "columnHeaderContextMenu" | "columnHeaderClicked", column: Column | ProvidedColumnGroup): void {
        const event: WithoutGridCommon<ColumnHeaderClickedEvent | ColumnHeaderContextMenuEvent> = {
            type: eventType,
            column,
        };

        this.beans.eventService.dispatchEvent(event);
    }

    protected destroy(): void {
        super.destroy();

        this.removeDragSource();
        (this.comp as any) = null;
        (this.column as any) = null;
        (this.resizeFeature as any) = null;
        (this.lastFocusEvent as any) = null;
        (this.columnGroupChild as any) = null;
        (this.parentRowCtrl as any) = null;
        (this.eGui as any) = null;
    }
}
