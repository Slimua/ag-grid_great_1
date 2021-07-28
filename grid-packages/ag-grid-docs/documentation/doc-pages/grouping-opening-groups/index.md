---
title: "Row Grouping - Opening Groups"
enterprise: true
---

This section covers different ways to control how row groups are expanded and collapsed.

## Opening Group Levels by Default

To open all groups down to a given group level use the `groupDefaultExpanded` grid option as shown below: 

<snippet>
const gridOptions = {
    columnDefs: [
        { field: 'country', rowGroup: true },
        { field: 'year', rowGroup: true },
        { field: 'sport' },
        { field: 'total' }
    ],
    // all 'country' row groups will be open by default
    groupDefaultExpanded: 1
}
</snippet>

In the snippet above, all `country` row groups will be expanded by default as `groupDefaultExpanded = 1`.

By default `groupDefaultExpanded = 0` which means no groups are expanded by default. To expand all row groups
set `groupDefaultExpanded = -1`.

The example below demonstrates the `groupDefaultExpanded` behaviour. Note the following:

- There are two active row groups as the supplied `country` and `year` column definitions have `rowGroup=true` declared.

- All `country` row groups are expanded by default as `groupDefaultExpanded = 1`.

<grid-example title='Group Default Expanded' name='group-default-expanded' type='generated' options='{ "enterprise": true, "exampleHeight": 540, "modules": ["clientside", "rowgrouping"] }'></grid-example>

## Open Groups by Default

To have groups open by default, implement the grid callback `isGroupOpenByDefault`. This callback is invoked
each time a group is created.

<snippet>
const gridOptions = {
    // expand when year is '2004' or when country is 'United States'
    isGroupOpenByDefault: params => {
        return (params.field == 'year' && params.key == '2004') ||
            (params.field == 'country' && params.key == 'United States');
    }
}
</snippet>

The params passed to the callback are as follows:

```js
interface IsGroupOpenByDefaultParams {
  rowNode: RowNode; // the Row Node being considered
  rowGroupColumn: Column; // the Column for which this row is grouping
  level: number; // same as rowNode.level - what level the group is at, e.g. 0 for top level, 1 for second etc
  field: string; // same as rowNode.field - the field we are grouping on, e.g. 'country'
  key: any; // same as rowNode.key, the value of this group, e.g. 'Ireland'
}
```

In the example below, the country 'United States' and year '2004' are expanded by default. Note that year '2004' is expanded for all
countries, not just 'United States'.

<grid-example title='Open by Default' name='open-by-default' type='generated' options='{ "enterprise": true, "exampleHeight": 515, "modules": ["clientside", "rowgrouping"] }'></grid-example>

## Expanding Row Groups via API

To expand or contract a group via the API, you first must get a reference to the rowNode and then call `rowNode.setExpanded(boolean)`. This will result in the grid getting updated and displaying the correct rows. For example, to expand a group with the name 'Zimbabwe' would be done as follows:

<snippet>
gridOptions.api.forEachNode(node => {
    if (node.key === 'Zimbabwe') {
        node.setExpanded(true);
    }
});
</snippet>

## Next Up

Continue to the next section to learn about grouping with [Complex Objects](../grouping-complex-objects/).