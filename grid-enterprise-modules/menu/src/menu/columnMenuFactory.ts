import {
    AgMenuList,
    Autowired,
    Bean,
    BeanStub,
    Column,
    ColumnModel,
    FilterManager,
    IRowModel,
    MenuItemDef,
    _
} from "@ag-grid-community/core";
import { MenuItemMapper } from "./menuItemMapper";

@Bean('columnMenuFactory')
export class ColumnMenuFactory extends BeanStub {
    @Autowired('menuItemMapper') private readonly menuItemMapper: MenuItemMapper;
    @Autowired('columnModel') private readonly columnModel: ColumnModel;
    @Autowired('rowModel') private readonly rowModel: IRowModel;
    @Autowired('filterManager') private readonly filterManager: FilterManager;

    private static MENU_ITEM_SEPARATOR = 'separator';

    public createMenu(parent: BeanStub, column: Column, sourceElement: () => HTMLElement): AgMenuList {
        const menuList = parent.createManagedBean(new AgMenuList());

        const menuItems = this.getMenuItems(column);
        const menuItemsMapped = this.menuItemMapper.mapWithStockItems(menuItems, column, sourceElement);

        menuList.addMenuItems(menuItemsMapped);

        return menuList;
    }

    private getMenuItems(column?: Column): (string | MenuItemDef)[] {
        const defaultMenuOptions = this.getDefaultMenuOptions(column);
        let result: (string | MenuItemDef)[];

        const userFunc = this.gridOptionsService.getCallback('getMainMenuItems');

        if (column && userFunc) {
            result = userFunc({
                column,
                defaultItems: defaultMenuOptions
            });
        } else {
            result = defaultMenuOptions;
        }

        // GUI looks weird when two separators are side by side. this can happen accidentally
        // if we remove items from the menu then two separators can edit up adjacent.
        _.removeRepeatsFromArray(result, ColumnMenuFactory.MENU_ITEM_SEPARATOR);

        return result;
    }

    private getDefaultMenuOptions(column?: Column): string[] {
        const result: string[] = [];

        const enableNewFormat = column?.getMenuParams()?.enableNewFormat;

        if (enableNewFormat) {
            result.push('columnChooser');
            result.push(ColumnMenuFactory.MENU_ITEM_SEPARATOR);
        }

        if (!column) {
            result.push('resetColumns');
            return result;
        }

        const allowPinning = !column.getColDef().lockPinned;

        const rowGroupCount = this.columnModel.getRowGroupColumns().length;
        const doingGrouping = rowGroupCount > 0;

        const allowValue = column.isAllowValue();
        const allowRowGroup = column.isAllowRowGroup();
        const isPrimary = column.isPrimary();
        const pivotModeOn = this.columnModel.isPivotMode();

        const isInMemoryRowModel = this.rowModel.getType() === 'clientSide';

        const usingTreeData = this.gridOptionsService.get('treeData');

        const allowValueAgg =
            // if primary, then only allow aggValue if grouping and it's a value columns
            (isPrimary && doingGrouping && allowValue)
            // secondary columns can always have aggValue, as it means it's a pivot value column
            || !isPrimary;

        if (
            enableNewFormat &&
            this.filterManager.isFilterAllowed(column) &&
            !column.getColDef().floatingFilter
        ) {
            result.push('columnFilter');
            result.push(ColumnMenuFactory.MENU_ITEM_SEPARATOR);
        }

        if (allowPinning) {
            result.push('pinSubMenu');
        }

        if (allowValueAgg) {
            result.push('valueAggSubMenu');
        }

        if (allowPinning || allowValueAgg) {
            result.push(ColumnMenuFactory.MENU_ITEM_SEPARATOR);
        }

        result.push('autoSizeThis');
        result.push('autoSizeAll');
        result.push(ColumnMenuFactory.MENU_ITEM_SEPARATOR);

        const showRowGroup = column.getColDef().showRowGroup;
        if (showRowGroup) {
            result.push('rowUnGroup');
        } else if (allowRowGroup && column.isPrimary()) {
            if (column.isRowGroupActive()) {
                const groupLocked = this.columnModel.isColumnGroupingLocked(column);
                if (!groupLocked) {
                    result.push('rowUnGroup');
                }
            } else {
                result.push('rowGroup');
            }
        }
        result.push(ColumnMenuFactory.MENU_ITEM_SEPARATOR);
        result.push('resetColumns');

        // only add grouping expand/collapse if grouping in the InMemoryRowModel
        // if pivoting, we only have expandable groups if grouping by 2 or more columns
        // as the lowest level group is not expandable while pivoting.
        // if not pivoting, then any active row group can be expanded.
        const allowExpandAndContract = isInMemoryRowModel && (usingTreeData || rowGroupCount > (pivotModeOn ? 1 : 0));

        if (allowExpandAndContract) {
            result.push('expandAll');
            result.push('contractAll');
        }

        return result;
    }
}
