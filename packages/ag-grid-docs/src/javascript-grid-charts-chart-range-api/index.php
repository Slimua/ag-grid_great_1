<?php
$pageTitle = "Charts: Chart API";
$pageDescription = "ag-Grid is a feature-rich data grid that can also chart data out of the box. Learn how to chart data directly from inside ag-Grid.";
$pageKeyboards = "Javascript Grid Charting";
$pageGroup = "feature";
include '../documentation-main/documentation_header.php';
?>

    <h1 class="heading-enterprise">Chart API</h1>

    <p class="lead">
        In addition to users creating their own charts from the grid, charts can also be generated by using the Chart API.
    </p>

    <h2>Range Charts</h2>

    <p>
        Charts can be created programmatically from a range via the grid's <code>createRangeChart()</code> API. The interface is
        as follows:
    </p>

    <snippet>
function createRangeChart(params: CreateRangeChartParams): ChartRef | undefined;

interface CreateRangeChartParams {
{
    cellRange: CellRangeParams;
    chartType: ChartType;
    chartContainer?: HTMLElement;
    suppressChartRanges?: boolean;
    aggFunc?: string | IAggFunc;
    processChartOptions?: (params: ProcessChartOptionsParams) => ChartOptions;
}

interface CellRangeParams {
    // start row
    rowStartIndex?: number;
    rowStartPinned?: string;

    // end row
    rowEndIndex?: number;
    rowEndPinned?: string;

    // columns
    columnStart?: string | Column;
    columnEnd?: string | Column;
    columns?: (string | Column)[];
}

type ChartType =
    'groupedColumn' |
    'stackedColumn' |
    'normalizedColumn' |
    'groupedBar' |
    'stackedBar' |
    'normalizedBar' |
    'line' |
    'scatter' |
    'bubble' |
    'pie' |
    'doughnut' |
    'area' |
    'stackedArea' |
    'normalizedArea';

interface IAggFunc {
    (input: any[]): any;
}

interface ProcessChartOptionsParams {
    type: ChartType;
    options: ChartOptions;
}</snippet>

    <p>
        The provided params contains the following attributes:
    </p>

    <ul>
        <li>
            <code>cellRange</code>: Defines the range of cells to be charted. A range is normally defined
            with start and end rows and a list of columns. If the start and end rows are omitted, the range
            covers all rows (i.e. entire columns are selected).
            The columns can either be defined using a start and end column (the range will cover the start
            and end columns and all columns in between), or columns can be supplied specifically in cases
            where the required columns are not adjacent to each other.
            See <a href="../javascript-grid-range-selection/#api-addcellrange-rangeselection">Add Cell Range</a>
            for more details.
        </li>
        <li>
            <code>chartType</code>: The type of chart to create. The options are
            <code>'groupedColumn', 'stackedColumn', 'normalizedColumn', 'groupedBar', 'stackedBar', 'normalizedBar', 'line', 'scatter', 'bubble', 'pie', 'doughnut', 'area', 'stackedArea', 'normalizedArea'</code>
        </li>
        <li>
            <code>chartContainer</code>: If the chart is to be displayed outside of the grid then a chart container 
            should be provided. If the chart is to be displayed using the grid's popup window mechanism then leave as <code>undefined</code>.
        </li>
        <li>
            <code>suppressChartRanges</code>: By default, when a chart is displayed using the grid, the grid will
            highlight the range the chart is charting when the chart gets focus. To suppress this behaviour,
            set <code>suppressChartRanges=true</code>.
        </li>
        <li>
            <code>aggFunc</code>: The aggregation function that should be applied to all series data. The built-in aggregation
            functions are <code>'sum', 'min', 'max', 'count', 'avg', 'first', 'last'</code>.
            Alternatively, custom aggregation functions can be provided if they conform to the <code>IAggFunc</code> interface
            shown above.
        </li>
        <li>
            <code>processChartOptions</code>: A callback to configure the rendered chart. This works the same
            as the grid callback <code>processChartOptions</code> described in
            <a href="../javascript-grid-charts-customisation/">Chart Customisation</a>.
        </li>
    </ul>

    <p>
        The API returns a <code>ChartRef</code> object when a <code>chartContainer</code> is provided.
        This is the same structure that is provided to the <code>createChartContainer()</code> callback.
        The <code>ChartRef</code> provides the application with the <code>destroyChart()</code>
        method that is required when the application wants to dispose the chart.
    </p>

    <h3>Example: Charts in Grid Popup Window</h3>

    <p>
        This example shows how charts can be created in the grid's provided popup window. The following can be noted:
    </p>

    <ul>
        <li>
            Clicking 'Gold & Silver, 5 Rows' will chart the first five rows of Gold and Silver by Country.
        </li>
        <li>
            Clicking 'Bronze, All Rows' will chart Bronze by Country using all rows
            (the provided cell range does not specify rows).
        </li>
    </ul>

    <?= example('Charts in Grid Popup Window', 'chart-api', 'generated', array("enterprise" => true)) ?>

    <h3>Example: Charts in Dashboard</h3>

    <p>
        This example passes a <code>chartContainer</code> to the API to place the chart in a location other
        than the grid's popup window. The following can be noted:
    </p>

    <ul>
        <li>The charts are placed in <code>div</code> elements outside of the grid.</li>
        <li>The two pie charts are showing aggregations rather than charting individual rows.</li>
        <li>Clicking on a chart highlights the range in the grid for which the chart is based.</li>
        <li>
            The bar chart is sensitive to changes in the rows. For example if you sort, the chart updates to
            always chart the first five rows.
        </li>
        <li>All data is editable in the grid. Changes to the grid data is reflected in the charts.</li>
        <li>
            The two pie charts have legends beneath. This is configured in the
            <code>processChartOptions()</code>.
        </li>
    </ul>

    <?= example('Charts in Dashboard', 'dashboard', 'generated', array("enterprise" => true, "exampleHeight" => 700)) ?>

    <h2>Pivot Charts</h2>
    
    <p>
        You can also use the API to create a pivot chart. There are fewer parameters available as the pivot chart is always 
        generated from all data in the grid:
    </p>

    <snippet>
function createPivotChart(params: CreatePivotChartParams): ChartRef | undefined;

interface CreatePivotChartParams {
    chartType: ChartType;
    chartContainer?: HTMLElement;
    processChartOptions?: (params: ProcessChartOptionsParams) => ChartOptions;
}</snippet>

    <p>The attributes have the same behaviour as described earlier.</p>

    <h3>Example: Pivot Chart</h3>

    <p>This is an example showing the pivot chart API in action, using a specified chart container.</p>

    <?= example('Pivot Chart', 'pivot-chart-api', 'generated', array("enterprise" => true, "exampleHeight" => 900)) ?>

    <h2>Next Up</h2>

    <p>
        Continue to the next section to learn how to: <a href="../javascript-grid-charts-container/">Provide a Chart Container</a>.
    </p>


<?php include '../documentation-main/documentation_footer.php'; ?>
