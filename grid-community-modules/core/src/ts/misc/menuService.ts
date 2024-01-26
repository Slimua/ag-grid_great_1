import { BeanStub } from "../context/beanStub";
import { Autowired, Bean, Optional, PostConstruct } from "../context/context";
import { IMenuFactory } from "../interfaces/iMenuFactory";
import { IContextMenuFactory } from "../interfaces/iContextMenuFactory";
import { Column } from "../entities/column";
import { ContainerType } from "../interfaces/iAfterGuiAttachedParams";
import { RowNode } from "../entities/rowNode";
import { CtrlsService } from "../ctrlsService";
import { AnimationFrameService } from "./animationFrameService";
import { IColumnChooserFactory } from "../interfaces/iColumnChooserFactory";
import { ColumnChooserParams } from "../entities/colDef";

interface BaseShowColumnMenuParams {
    column?: Column,
}

interface BaseShowFilterMenuParams {
    column: Column,
    containerType: ContainerType;
}

interface MouseShowMenuParams {
    mouseEvent: MouseEvent | Touch;
    positionBy: 'mouse';
}

interface ButtonShowMenuParams {
    buttonElement: HTMLElement;
    positionBy: 'button';
}

interface AutoShowMenuParams {
    positionBy: 'auto';
}

export type ShowColumnMenuParams = (MouseShowMenuParams | ButtonShowMenuParams) & BaseShowColumnMenuParams;

export type ShowFilterMenuParams = (MouseShowMenuParams | ButtonShowMenuParams | AutoShowMenuParams) & BaseShowFilterMenuParams;

interface BaseShowContextMenuParams { 
    rowNode?: RowNode | null,
    column?: Column | null,
    value: any,
    anchorToElement: HTMLElement
}

interface MouseShowContextMenuParams {
    mouseEvent: MouseEvent;
}

interface TouchShowContextMenuParam {
    touchEvent: TouchEvent;
}

export type ShowContextMenuParams = (MouseShowContextMenuParams | TouchShowContextMenuParam) & BaseShowContextMenuParams;

@Bean('menuService')
export class MenuService extends BeanStub {
    @Optional('enterpriseMenuFactory') private readonly enterpriseMenuFactory? : IMenuFactory;
    @Autowired('filterMenuFactory') private readonly filterMenuFactory: IMenuFactory;
    @Optional('contextMenuFactory') private readonly contextMenuFactory?: IContextMenuFactory;
    @Autowired('ctrlsService') private ctrlsService: CtrlsService;
    @Autowired('animationFrameService') private animationFrameService: AnimationFrameService;
    @Optional('columnChooserFactory') private columnChooserFactory: IColumnChooserFactory;

    private activeMenuFactory: IMenuFactory;

    @PostConstruct
    private postConstruct(): void {
        this.activeMenuFactory = this.enterpriseMenuFactory ?? this.filterMenuFactory;
    }

    public showColumnMenu(params: ShowColumnMenuParams): void {
        if (params.positionBy === 'button') {
            const { column, buttonElement } = params;
            this.activeMenuFactory.showMenuAfterButtonClick(column, buttonElement, 'columnMenu');
        } else {
            const { column, mouseEvent } = params;
            this.activeMenuFactory.showMenuAfterMouseEvent(column, mouseEvent, 'columnMenu');
        }
    }

    public showFilterMenu(params: ShowFilterMenuParams): void {
        const { column, containerType, positionBy } = params;
        const menuFactory: IMenuFactory = !column.getMenuParams()?.enableNewFormat && this.enterpriseMenuFactory
            ? this.enterpriseMenuFactory
            : this.filterMenuFactory;
        if (positionBy === 'button') {
            const { buttonElement } = params;
            menuFactory.showMenuAfterButtonClick(column, buttonElement, containerType, true);
        } else if (positionBy === 'mouse') {
            const { mouseEvent } = params;
            menuFactory.showMenuAfterMouseEvent(column, mouseEvent, containerType, true);
        } else {
            // auto
            this.ctrlsService.getGridBodyCtrl().getScrollFeature().ensureColumnVisible(column, 'auto');
            // make sure we've finished scrolling into view before displaying the filter
            this.animationFrameService.requestAnimationFrame(() => {
                const eHeader = this.ctrlsService.getHeaderRowContainerCtrl(column.getPinned()).getHtmlElementForColumnHeader(column)!;
                menuFactory.showMenuAfterButtonClick(column, eHeader, containerType, true);
            });
        }
    }

    public showHeaderContextMenu(column: Column | undefined, mouseEvent?: MouseEvent, touchEvent?: TouchEvent): void {
        this.activeMenuFactory.showMenuAfterContextMenuEvent(column, mouseEvent, touchEvent);
    }

    public showContextMenu(
        params: ShowContextMenuParams
    ): void {
        const { column, anchorToElement, rowNode, value } = params;
        this.contextMenuFactory?.onContextMenu(
            (params as MouseShowContextMenuParams).mouseEvent ?? null,
            (params as TouchShowContextMenuParam).touchEvent ?? null,
            rowNode ?? null,
            column ?? null,
            value,
            anchorToElement
        );
    }

    public showColumnChooser(params: { column?: Column | null, params?: ColumnChooserParams }): void {
        this.columnChooserFactory?.showColumnChooser(params);
    }

    public hidePopupMenu(): void {
        // hide the context menu if in enterprise
        this.contextMenuFactory?.hideActiveMenu();
        // and hide the column menu always
        this.activeMenuFactory.hideActiveMenu();
    }

    public isMenuEnabled(column: Column): boolean {
        return this.activeMenuFactory.isMenuEnabled(column);
    }
}
