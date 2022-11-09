---
title: "Chart Toolbar"
enterprise: true
---

The chart toolbar appears when the mouse hovers over the top right area of the chart, and provides access to additional functionality and the chart configuration sidebar.


<div style="display: flex; margin-bottom: 25px; margin-top: 25px; margin-left: 40px;">
    <div style="flex: 1 1 0">
        <img src="resources/chart-toolbar.png" alt="Chart Toolbar"/>
    </div>
    <div style="flex: 1 1 0;">
        From the toolbar, users can:
        <ul>
            <li>Change the chart type</li>
            <li>Change the theme</li>
            <li>Change which columns are used as categories and series</li>
            <li>Format different aspects of the chart</li>
            <li>Unlink the chart from the grid</li>
            <li>Download the chart</li>
        </ul>
    </div>
</div>

## Configuration Sidebar

Clicking on the 'hamburger' icon will open up the configuration sidebar, which provides access to a number of panels that allow the user to configure different aspects of the chart.

### Chart Settings

The chart settings panel allows users to change the chart type as well as the theme used in the chart as demonstrated below:

<gif src="chart-settings.gif" alt="Chart Settings"></gif>

Notice that charts are organised into different groups and the current chart can be changed by selecting the icon of a different chart.

The theme used by the chart can also be changed via the carousel located at the bottom of the chart setting panel.

### Chart Data

The chart data panel is used to dynamically change the data being charted as shown below:

<gif src="chart-data.gif" alt="Chart Data"></gif>

Using the chart data panel the category used in the chart can be changed via radio button selections. Multiple series can be charted and these can also be changed via checkbox selection.

Grid columns can either be configured as categories or series for charting or left for the grid to infer based on the data contained in the columns.

For more details on how the grid determines which columns are to be used as chart categories and series see the section on [Defining Categories and Series](/integrated-charts-range-chart/#defining-categories-and-series).

### Chart Format

The chart format panel allows users to change the appearance of the chart as shown below:

<gif src="chart-format.gif" alt="Chart Format"></gif>

Chart options corresponding to the currently selected chart type appear in the format panel. This gives users full control over the appearance of the chart.

## Unlinking Charts

Charts are linked to the data in the grid by default, so that if the data changes, the chart will also update. However, it is sometimes desirable to unlink a chart from the grid data. For instance, users may want to prevent a chart from being updated when subsequent sorts and filters are applied in the grid.

Unlinking a chart is achieved through the 'Unlink Chart' toolbar item as shown below:

<gif src="chart-unlinking.gif" alt="Chart Unlinking"></gif>

Notice that the chart range disappears from the grid when the chart has been unlinked, and subsequent changes to the grid sorting do not impact the chart.

## Downloading Charts

The 'Download Chart' toolbar item will download the chart as a PNG file. Note that the chart is drawn using Canvas in the browser and as such the user can also right click on the chart and save just like any other image on a web page.

## Toolbar Customisation

By default, all available toolbar items and menu panels can be accessed. However, items can be removed and reordered via the `gridOptions.getChartToolbarItems(params)` callback function.

<api-documentation source='grid-options/properties.json' section='charts' names='["getChartToolbarItems"]'  ></api-documentation>

This function receives the `GetChartToolbarItemsParams` object which contains the list of elements that are included by default in `defaultItems`, along with the grid APIs.

The list returned by the `gridOptions.getChartToolbarItems(params)` callback can be modified to reorder and omit items from the toolbar. For instance, returning an empty array will hide all toolbar items.

The example below shows how the toolbar can be customised. Notice the following:

- **Download Chart** - has been positioned as the first toolbar item.
- **Chart Data Panel** - appears first in the tabbed menu.
- **Chart Format Panel** - has been removed from the tabbed menu.
- **Unlink Toolbar Item** - has been removed from the toolbar.

<grid-example title='Toolbar Customisation' name='custom-toolbar' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

## Chart Tool Panel Customisation

The Chart Tool Panel can be customised within the `chartToolPanelsDef` grid option.

<api-documentation source='grid-options/properties.json' section='charts' names='["chartToolPanelsDef"]' ></api-documentation>

### Customising chart tool panels

The Chart Tool Panels can be reorganised using the `chartToolPanelsDef.panels` grid option, and a tool panel can be opened when the chart is loaded using the `chartToolPanelsDef.defaultToolPanel` grid option.

[[note]]
| Note that when the `chartToolPanels` grid option is used, the panels returned from `gridOptions.getChartToolbarItems(params)` are ignored. If `chartToolPanelsDef` is defined without `chartToolPanelsDef.panels`, **all panels** will be shown regardless of the results of `gridOptions.getChartToolbarItems(params)`.

The example below shows panels being reorganised with the `format` tool panel open by default:

<grid-example title='Customising chart tool panels' name='customise-panels' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

### Customising settings panel chart groups

The list of chart groups shown on the settings panel can be customised using the `chartToolPanelsDef.settingsPanel.chartGroupsDef` grid option. The full list of chart groups are as follows:

<snippet>
const gridOptions = {
    chartToolPanelsDef: {
        settingsPanel: {
            chartGroupsDef: {
                columnGroup: [
                    'column',
                    'stackedColumn',
                    'normalizedColumn'
                ],
                barGroup: [
                    'bar',
                    'stackedBar',
                    'normalizedBar'
                ],
                pieGroup: [
                    'pie',
                    'doughnut'
                ],
                lineGroup: [
                    'line'
                ],
                scatterGroup: [
                    'scatter',
                    'bubble'
                ],
                areaGroup: [
                    'area',
                    'stackedArea',
                    'normalizedArea'
                ],
                histogramGroup: [
                    'histogram'
                ],
                combinationGroup: [
                    'columnLineCombo',
                    'areaColumnCombo',
                    'customCombo'
                ]
            }
        }
    }
}
</snippet>

The example below shows a reordering of chart groups with some chart groups and types removed:

* Pie group appears first
* Columns group appears second with the chart types reordered
* Bar appears last with only a single bar chart type

<grid-example title='Customising settings panel chart groups' name='customise-chart-groups' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

### Customising format panel groups

The groups shown on the format panel can be customised using the `chartToolPanelsDef.formatPanel.groups` grid option. The list specified also indicates the order the groups are shown and whether they are open by default. If `chartToolPanelsDef.formatPanel.groups` is not specified, all groups are shown and are closed by default.

[[note]]
| Different chart types will display different format panel groups and will override the groups specified in the grid option if needed. For example, a pie chart does not have an axis or a navigator, so if pie chart is selected, the **Axis** and **Navigator** format panel groups will not be shown even if they are listed in `chartToolPanelsDef.formatPanel.groups`.

The default list and order of format groups are as follows:

<snippet>
const gridOptions = {
    chartToolPanelsDef: {
        formatPanel: {
            groups: [
                {
                    type: 'chart'
                    // If `isOpen` is not specified, group is closed by default
                    // isOpen: false
                },
                { type: 'legend', isOpen: false },
                { type: 'axis', isOpen: false },
                { type: 'series', isOpen: false },
                { type: 'navigator', isOpen: false }
            ]
        }
    }
}
</snippet>

The following example shows the format panel with:

* `chart` group open by default
* `series`, `legend` and `axis` groups shown afterwards, closed by default
* `navigator` not shown

<grid-example title='Customising format panel groups' name='customise-format-groups' type='generated' options='{ "enterprise": true, "modules": ["clientside", "menu", "charts"] }'></grid-example>

## Next Up

Continue to the next section to learn about the: [Chart Container](/integrated-charts-container/).

