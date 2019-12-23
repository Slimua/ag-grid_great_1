<?php
$pageTitle = "Charts: Bar/Column Chart Customisation";
$pageDescription = "ag-Grid is a feature-rich data grid that can also chart data out of the box. Learn how to chart data directly from inside ag-Grid.";
$pageKeyboards = "Javascript Grid Charting";
$pageGroup = "feature";
include '../documentation-main/documentation_header.php';
?>

<h1 class="heading-enterprise">Bar/Column Chart Customisation</h1>

<p class="lead">
    In addition to the <a href="../javascript-grid-charts-customisation-general">general chart customisations</a> and
    <a href="../javascript-grid-charts-customisation-cartesian">cartesian chart customisations</a>, you can also
    use these customisations for bar/column charts.
</p>

<h2>Option Interfaces</h2>

<snippet>
interface BarChartOptions {
    seriesDefaults: {
        fill: FillOptions;
        stroke: StrokeOptions;

        // The shadow type to use for bars. Defaults to no shadow.
        // Note: shadows can noticeably slow down rendering of charts with a few hundred bars.
        shadow: DropShadowOptions;

        label: BarSeriesLabelOptions;

        // The style to apply to a bar when it is hovered over or tapped
        highlightStyle: HighlightOptions;

        // Configures the tooltip for bars when they are hovered over or tapped
        tooltip: TooltipOptions;
    };
}

interface FillOptions {
    colors: string[]; // default: &lt;dependent on selected palette&gt;

    // Valid range from 0 (transparent) to 1 (opaque)
    opacity: number; // default: 1
}

interface StrokeOptions {
    colors: string[]; // default: &lt;dependent on selected palette&gt;

    // Valid range from 0 (transparent) to 1 (opaque)
    opacity: number; // default: 1

    width: number; // default: 1
}

interface DropShadowOptions {
    enabled: boolean; // default: false
    color: string; // default: 'rgba(0, 0, 0, 0.5)'
    xOffset: number; // default: 3
    yOffset: number; // default: 3
    blur: number; // default: 5
}

interface BarSeriesLabelOptions {
    enabled: boolean; // default: false
    fontStyle: FontStyle; // default: 'normal'
    fontWeight: FontWeight; // default: 'normal'
    fontSize: number; // default: 12
    fontFamily: string; // default: 'Verdana, sans-serif'
    color: string; // default: &lt;dependent on light/dark mode&gt;
    formatter?: (params: { value: number }) => string;
}

interface HighlightOptions {
    fill: string; // default: 'yellow'
    stroke?: string;
}

interface TooltipOptions {
    enabled: boolean; // default: true
    renderer?: (params: BarTooltipRendererParams) => string; // should return a valid HTML string
}

interface BarTooltipRendererParams {
    // The datum object for the highlighted bar that the tooltip is being rendered for
    datum: any;
    // The key of the datum object that contains the X value
    xKey: string;
    // The name of the column that the X value is from
    xName: string;
    // The key of the datum object that contains the Y value
    yKey: string;
    // The name of the column that the Y value is from
    yName: string;
    // The title of the series the datum is in
    title?: string;
    // The fill colour of the series the datum is in
    color: string;
}
</snippet>

<h3>Example: Bar/Column Chart Customisations</h3>

<p>
    The example below changes all available styling options. The styling options are exaggerated
    to demonstrate each option rather than to produce a chart that looks nice!
</p>

<?= example('Bar/Column Chart Customisations', 'custom-bar-chart', 'generated', array("enterprise" => true)) ?>

<?php include '../documentation-main/documentation_footer.php'; ?>
