---
title: "Advanced Filter"
---

The Advanced Filter allows for complex filter conditions to be entered across columns in a single type-ahead input.

## Enabling Advanced Filter

The Advanced Filter is enabled by setting the property `enableAdvancedFilter = true`. By default, the Advanced Filter is displayed between the column headers and the grid rows, where the [Floating Filters](/floating-filters/) would be displayed if they were enabled.

<snippet>
const gridOptions = {
    enableAdvancedFilter: true,
}
</snippet>

The following example demonstrates the Advanced Filter:
- Start typing `athlete` into the Advanced Filter input. As you type, the list of suggested column names will be filtered down.
- Select the `Athlete` entry by pressing <kbd>Enter</kbd> or <kbd>Tab</kbd>, or using the mouse to click on the entry.
- Select the `contains` entry in a similar way.
- After the quote, type `michael` followed by an end quote (`"`).
- Press <kbd>Enter</kbd> or click the `Apply` button to execute the filter.
- The rows are now filtered to contain only **Athlete**s with names containing `michael`.
- Try out each of the columns to see how the different [Cell Data Types](/cell-data-types/) are handled.
- Complex filter expressions can be built up by using `AND` and `OR` along with brackets - `(` and `)`.

<grid-example title='Advanced Filter' name='advanced-filter' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "advancedfilter"] }'></grid-example>

<note>Advanced Filter and Column Filters cannot be active at the same time. Enabling Advanced Filter will disable Column Filters.</note>

## Configuring Columns

For a column to appear in the Advanced Filter, it needs to have `filter: true` (or set to a non-null and non-false value).

The different properties that can be set for each column are explained in the sections below, and demonstrated in the following example:
- The **Age** column is not available in the filter as `filter = false`.
- The **Sport** column is not available in the filter by default as hidden columns are excluded.
- After clicking **Include Hidden Columns**, the **Sport** column is available in the filter.
- The **Group** column does not appear in the filter, but its underlying column - **Country** - always appears.
- The **Athlete** column has Filter Params defined, so that it only shows the `contains` option and is case sensitive.
- The **Gold**, **Silver** and **Bronze** columns in the **Medals (-)** column group have a `headerValueGetter` defined and use the `location` property to have a different name in the filter (with a `(-)` suffix).

<grid-example title='Configuring Columns' name='configuring-columns' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "rowgrouping", "advancedfilter"] }'></grid-example>

### Including Hidden Columns

By default, hidden columns do not appear in the Advanced Filter. To make hidden columns appear, set `includeHiddenColumnsInAdvancedFilter = true`.

This can also be set via the API method `setIncludeHiddenColumnsInAdvancedFilter`.

<api-documentation source='grid-options/properties.json' section='filter' names='["includeHiddenColumnsInAdvancedFilter"]'></api-documentation>

<api-documentation source='grid-api/api.json' section='filter' names='["setIncludeHiddenColumnsInAdvancedFilter"]'></api-documentation>

### Row Grouping

When [Row Grouping](/grouping/), group columns will not appear in the Advanced Filter. The underlying columns will always appear, even if hidden.

### Column Names

The name by which columns appear in the Advanced Filter can be configured by using a [Header Value Getter](/value-getters/#header-value-getters) and checking for `location = 'advancedFilter'`.

### Filter Parameters

Certain properties can be set by using `colDef.filterParams`.

<snippet>
const gridOptions = {
    columnDefs: [
        {
            field: 'athlete',
            filterParams: {
                // perform case sensitive search
                caseSensitive: true,
                // limit options to `contains` only
                filterOptions: ['contains'],
            }
        }
    ]
}
</snippet>

For all [Cell Data Types](/cell-data-types/), the available filter options can be set via `filterOptions`.

The available options are as follows:

| Option Name             | Option Key            | Cell Data Type                                              |
| ----------------------- | --------------------- | ----------------------------------------------------------- |
| contains                | `contains`            | `text`, `object`                                            |
| does not contain        | `notContains`         | `text`, `object`                                            |
| equals                  | `equals`              | `text`, `object`                                            |
| =                       | `equals`              | `number`, `date`, `dateString`                              |
| not equal               | `notEqual`            | `text`, `object`                                            |
| !=                      | `notEqual`            | `number`, `date`, `dateString`                              |
| starts with             | `startsWith`          | `text`, `object`                                            |
| ends with               | `endsWith`            | `text`, `object`                                            |
| is blank                | `blank`               | `text`, `number`, `boolean`, `date`, `dateString`, `object` |
| is not blank            | `notBlank`            | `text`, `number`, `boolean`, `date`, `dateString`, `object` |
| >                       | `greaterThan`         | `number`, `date`, `dateString`                              |
| >=                      | `greaterThanOrEqual`  | `number`, `date`, `dateString`                              |
| <                       | `lessThan`            | `number`, `date`, `dateString`                              |
| <=                      | `lessThanOrEqual`     | `number`, `date`, `dateString`                              |
| is true                 | `true`                | `boolean`                                                   |
| is false                | `false`               | `boolean`                                                   |

For `text` and `object` Cell Data Types, `caseSensitive = true` can be set to enable case sensitivity.

For `number`, `date` and `dateString` Cell Data Types, the following properties can be set to include blank values for the relevant options:
- `includeBlanksInEquals = true`
- `includeBlanksInLessThan = true`
- `includeBlanksInGreaterThan = true`

## Filter Model / API

The Advanced Filter model describes the current state of the Advanced Filter. This is represented by an `AdvancedFilterModel`, which is either a `ColumnAdvancedFilterModel` for a single condition, or a `JoinAdvancedFilterModel` for multiple conditions:

<interface-documentation interfaceName='JoinAdvancedFilterModel' config='{"description":""}'></interface-documentation>

For example, the Advanced Filter `([Age] > 23 OR [Sport] ends with "ing") AND [Country] contains "united"` would be represented by the following model:

```js
const advancedFilterModel = {
    filterType: 'join',
    type: 'AND',
    conditions: [
      {
        filterType: 'join',
        type: 'OR',
        conditions: [
          {
            filterType: 'number',
            colId: 'age',
            type: 'greaterThan',
            filter: 23,
          },
          {
            filterType: 'text',
            colId: 'sport',
            type: 'endsWith',
            filter: 'ing',
          }
        ]
      },
      {
        filterType: 'text',
        colId: 'country',
        type: 'contains',
        filter: 'united',
      }
    ]
};
```

The Advanced Filter Model can be retrieved via the API method `getAdvancedFilterModel`, and set via the grid option `advancedFilterModel` or via the API method `setAdvancedFilterModel`.

<api-documentation source='grid-api/api.json' section='filter' names='["getAdvancedFilterModel"]'></api-documentation>

<api-documentation source='grid-options/properties.json' section='filter' names='["advancedFilterModel"]'></api-documentation>

<api-documentation source='grid-api/api.json' section='filter' names='["setAdvancedFilterModel"]'></api-documentation>

The Advanced Filter Model and API methods are demonstrated in the following example:
- The grid option `advancedFilterModel` is set so the Advanced Filter is automatically populated, and the grid is filtered.
- Clicking `Save Advanced Filter Model` will save the current Advanced Filter.
- Clicking `Restore Advanced Filter Model` will restore the previously saved Advanced Filter.
- Clicking `Set Custom Advanced Filter Model` will set `[Gold] >= 1`.
- Clicking `Clear Advanced Filter` will clear the current Advanced Filter.

<grid-example title='Advanced Filter Model / API' name='advanced-filter-model-api' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "advancedfilter"] }'></grid-example>

## Advanced Filter Parent

By default the Advanced Filter is displayed underneath the Column Headers, where the Floating Filters would normally appear.

It is possible to instead display the Advanced Filter outside of the grid (such as above it). This can be done by setting the grid option `advancedFilterParent` and providing it with a DOM element to contain the filter. It is also possible to call the API method `setAdvancedFilterParent`.

<api-documentation source='grid-options/properties.json' section='filter' names='["advancedFilterParent"]'></api-documentation>

<api-documentation source='grid-api/api.json' section='filter' names='["setAdvancedFilterParent"]'></api-documentation>

The [Popup Parent](https://localhost:8000/javascript-data-grid/context-menu/#popup-parent) must also be set to an element that contains both the Advanced Filter parent and the grid.

The following example demonstrates displaying the Advanced Filter outside of the grid:
- The Advanced Filter parent is set using an element directly above the grid.
- Popup Parent is set to an element containing both the grid and the Advanced Filter parent.

<grid-example title='External Parent' name='external-parent' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "advancedfilter"] }'></grid-example>

## Aggregation / Pivoting

The Advanced Filter will only work on leaf-level rows when using [Aggregation](/aggregation/). The `groupAggFiltering` property will be ignored.

When [Pivoting](/pivoting/), Pivot Result Columns will not appear in the Advanced Filter.
