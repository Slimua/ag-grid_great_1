import {
    AgMenuList,
    Autowired,
    Bean,
    BeanStub,
    Column, MenuItemDef, _
} from "@ag-grid-community/core";
import { MenuItemMapper } from "./menuItemMapper";

@Bean('columnMenuFactory')
export class ColumnMenuFactory extends BeanStub {
    @Autowired('menuItemMapper') private readonly menuItemMapper: MenuItemMapper;
    
    private static MENU_ITEM_SEPARATOR = 'separator';

    public createMenu(parent: BeanStub, column: Column | undefined, sourceElement: () => HTMLElement): AgMenuList {
        const menuList = parent.createManagedBean(new AgMenuList(0, {
            column: column ?? null,
            node: null,
            value: null
        }));

        const menuItems = this.getMenuItems(column);
        const menuItemsMapped = this.menuItemMapper.mapWithStockItems(menuItems, column ?? null, sourceElement);

        menuList.addMenuItems(menuItemsMapped);

        return menuList;
    }

    private getMenuItems(column?: Column): (string | MenuItemDef)[] {
        const defaultItems = this.getDefaultMenuOptions(column);
        let result: (string | MenuItemDef)[];

        const columnMainMenuItems = column?.getColDef().mainMenuItems;
        if (Array.isArray(columnMainMenuItems)) {
            result = columnMainMenuItems;
        } else if (typeof columnMainMenuItems === 'function') {
            result = columnMainMenuItems(this.beans.gos.addGridCommonParams({
                column: column!,
                defaultItems
            }));
        } else {
            const userFunc = this.beans.gos.getCallback('getMainMenuItems');
            if (userFunc && column) {
                result = userFunc({
                    column,
                    defaultItems
                });
            } else {
                result = defaultItems;
            }
        }

        // GUI looks weird when two separators are side by side. this can happen accidentally
        // if we remove items from the menu then two separators can edit up adjacent.
        _.removeRepeatsFromArray(result, ColumnMenuFactory.MENU_ITEM_SEPARATOR);

        return result;
    }

    private getDefaultMenuOptions(column?: Column): string[] {
        const result: string[] = [];

        const isLegacyMenuEnabled = this.beans.menuService.isLegacyMenuEnabled();

        if (!column) {
            if (!isLegacyMenuEnabled) {
                result.push('columnChooser');
            }
            result.push('resetColumns');
            return result;
        }

        const allowPinning = !column.getColDef().lockPinned;

        const rowGroupCount = this.beans.columnModel.getRowGroupColumns().length;
        const doingGrouping = rowGroupCount > 0;

        const allowValue = column.isAllowValue();
        const allowRowGroup = column.isAllowRowGroup();
        const isPrimary = column.isPrimary();
        const pivotModeOn = this.beans.columnModel.isPivotMode();

        const isInMemoryRowModel = this.beans.rowModel.getType() === 'clientSide';

        const usingTreeData = this.beans.gos.get('treeData');

        const allowValueAgg =
            // if primary, then only allow aggValue if grouping and it's a value columns
            (isPrimary && doingGrouping && allowValue)
            // secondary columns can always have aggValue, as it means it's a pivot value column
            || !isPrimary;

        if (!isLegacyMenuEnabled && column.isSortable()) {
            const sort = column.getSort();
            if (sort !== 'asc') {
                result.push('sortAscending');
            }
            if (sort !== 'desc') {
                result.push('sortDescending');
            }
            if (sort) {
                result.push('sortUnSort');
            }
            result.push(ColumnMenuFactory.MENU_ITEM_SEPARATOR);
        }

        if (this.beans.menuService.isFilterMenuItemEnabled(column)) {
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
                const groupLocked = this.beans.columnModel.isColumnGroupingLocked(column);
                if (!groupLocked) {
                    result.push('rowUnGroup');
                }
            } else {
                result.push('rowGroup');
            }
        }
        result.push(ColumnMenuFactory.MENU_ITEM_SEPARATOR);
        if (!isLegacyMenuEnabled) {
            result.push('columnChooser');
        }
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
