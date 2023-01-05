---
title: "Set Filter - Tree List"
enterprise: true
---

This section describes the behaviour of the Set Filter Tree List and shows how it can be configured.

The Tree List allows the user to display the values in the Filter List grouped in a tree structure.

<image-caption src="filter-set-tree-list/resources/set-filter-tree-list.png" alt="Filter Tree List" constrained="true" centered="true"></image-caption>

## Enabling Tree Lists

Tree List is enabled by setting `filterParams.treeList = true`. There are four different ways the tree structure can be created:
- The column values are of type `Date`, in which case the tree will be year -> month -> day.
- Tree Data mode is enabled and the column is a group column. The Filter List will match the tree structure. A Key Creator must be supplied to convert the array of keys.
- Grouping is enabled and the column is the group column. The Filter List will match the group structure. A Key Creator must be supplied to convert the array of keys.
- A `filterParams.treeListPathGetter` is provided to get a custom tree path for the column values.

<interface-documentation interfaceName='ISetFilterParams' names='["treeListPathGetter","keyCreator"]' config='{"description":""}'></interface-documentation>

<snippet>
const gridOptions = {
    columnDefs: [
        {
            field: 'date',
            filter: 'agSetColumnFilter',
            filterParams: {
                treeList: true,
            }
        }
    ],
    autoGroupColumnDef: {
        field: 'athlete',
        filter: 'agSetColumnFilter',
        filterParams: {
            treeList: true,
            keyCreator: params => params.value.join('#')
        },
    },
}
</snippet>

The following example demonstrates enabling different types of Tree List in the Set Filter. Note the following:

1. The **Group**, **Date** and **Gold** columns all have `filterParams.treeList = true`.
2. The **Group** column Filter List matches the format of the Row Grouping. A Key Creator is specified to convert the path into a string.
3. The **Date** column is grouped by year -> month -> date.
4. The **Gold** column has `filterParams.treeListPathGetter` provided which groups the values into a tree of >2 and <=2.

<grid-example title='Filter Tree List' name='filter-tree-list' type='generated' options='{ "enterprise": true, "modules": ["clientside", "setfilter", "menu", "columnpanel", "filterpanel"] }'></grid-example>

## Sorting Tree Lists

Values inside a Tree List will be sorted similar to [normal Set Filter Lists](/filter-set-filter-list/#sorting-filter-lists), with the exception that if the column values are of type `Date`, they will instead be sorted based on the raw date values.

A Comparator can be used to change the sort order of Tree Lists just like with normal Set Filter Lists, with [the same conditions applying](/filter-set-filter-list/#sorting-filter-lists). For Tree Lists, the Comparator is applied to the child values, sorting the entire tree in one pass rather than for each level. The Comparator will be provided the following:
- The column value for `Date` objects and custom tree paths.
- The tree path (`string[]` or `null`) for Tree Data and Grouping.

The following example demonstrates changing the sorting of the Tree List. Note the following:

1. Tree Data is turned on via `treeData = true`.
2. The **Employee** column has `filterParams.treeList = true` and the Filter List matches the format of the Tree Data. A Key Creator is specified to convert the path into a string.
3. The **Employee** column has a `filterParams.comparator` supplied which displays the Filter List in reverse alphabetical order.

<grid-example title='Sorting Tree Lists' name='sorting-tree-lists' type='generated' options='{ "enterprise": true, "modules": ["clientside", "setfilter", "menu", "columnpanel", "filterpanel"] }'></grid-example>

## Formatting Values

The values can be formatted in the Filter List via `filterParams.treeListFormatter`. This allows a different format to be used for each level of the tree.

<interface-documentation interfaceName='ISetFilterParams' names='["treeListFormatter"]' config='{"description":""}'></interface-documentation>

<snippet>
const gridOptions = {
    columnDefs: [
        {
            field: 'date',
            filter: 'agSetColumnFilter',
            filterParams: {
                treeList: true,
                treeListFormatter: (pathKey, level) => {
                    if (level === 0 && pathKey) {
                        return `Year ${pathKey}`;
                    }
                    return pathKey;
                }
            }
        }
    ],
}
</snippet>

`filterParams.valueFormatter` is not used in the Filter List when Tree List is turned on. However, it is still used to format the values displayed in the Floating Filter. The value provided to the Value Formatter is the original value, e.g. a `Date` object for dates, the child value for Tree Data or Grouping, or the column value for a custom tree path.

The following example demonstrates formatting the Tree List. Note the following:

1. The **Date** column has `filterParams.treeList = true`.
2. The **Date** column has a `filterParams.treeListFormatter` provided which formats the numerical month value to display as the name of the month.
3. When a date is filtered in the **Date** column , `filterParams.valueFormatter` is used to format the value displayed in the Floating Filter.

<grid-example title='Formatting Tree List Values' name='formatting-tree-list-values' type='generated' options='{ "enterprise": true, "modules": ["clientside", "setfilter", "menu", "columnpanel", "filterpanel"] }'></grid-example>

## Mini Filter Behaviour

 When searching in the Mini Filter, all children will be included when a parent matches the search value. A parent will be included if it has any children that match the search value, or it matches itself.

## Filter Value Tooltips

When using Tree List with a [Custom Tooltip Component](/component-tooltip/), the tooltip params will be of type `ISetFilterTreeListTooltipParams` which additionally contains the level of the item within the tree. Set Filter tooltips are described in more detail [here](/filter-set-filter-list/#filter-value-tooltips).

Additional property available on `ISetFilterTreeListTooltipParams`:

<interface-documentation interfaceName='ISetFilterTreeListTooltipParams' names='["level"]' config='{"description":""}'></interface-documentation>

## Next Up

Continue to the next section: [Mini Filter](/filter-set-mini-filter/).
