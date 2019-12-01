<?php
$pageTitle = "Charts: Line Chart Customisation";
$pageDescription = "ag-Grid is a feature-rich data grid that can also chart data out of the box. Learn how to chart data directly from inside ag-Grid.";
$pageKeyboards = "Javascript Grid Charting";
$pageGroup = "feature";
include '../documentation-main/documentation_header.php';
?>

<h1 class="heading-enterprise">Line Chart Customisation</h1>

<p class="lead">
    In addition to the <a href="../javascript-grid-charts-customisation-general">general chart customisations</a>, you can also
    use these customisations for line charts.
</p>

<h2>Option Interfaces</h2>

<snippet>
interface LineChartOptions {
    xAxis: AxisOptions;
    yAxis: AxisOptions;

    seriesDefaults: {
        // The fill colours used by the series' markers and the line itself
        fill: FillOptions;

        // The stroke colours to be used by the series' markers
        stroke: StrokeOptions;

        // The style to apply to a marker when it is hovered over or tapped
        highlightStyle?: HighlightOptions;

        marker: MarkerOptions;

        // Configures the tooltip for bars when they are hovered over or tapped
        tooltip: TooltipOptions;
    };
}

interface AxisOptions {
    title?: CaptionOptions;
    line: AxisLineOptions;
    tick: AxisTickOptions;
    label: AxisLabelOptions;

    // The styles of the grid lines. These are repeated. If only a single style is provided,
    // it will be used for all grid lines, if two styles are provided, every style will be
    // used by every other line, and so on.
    gridStyle: GridStyle[];
}

interface CaptionOptions {
    enabled?: boolean;
    text?: string;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
}

type FontStyle = 'normal' | 'italic' | 'oblique';

type FontWeight = 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

interface AxisLineOptions {
    width: number; // default: 1
    color: string; // default: 'rgba(195, 195, 195, 1)'
}

interface AxisTickOptions {
    width: number; // default: 1
    size: number; // default: 6
    color: string; // default: 'rgba(195, 195, 195, 1)'
}

interface AxisLabelOptions {
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number; // default: 12
    fontFamily?: string; // default: 'Verdana, sans-serif'
    color?: string; // default: 'black'
    padding: number; // default: 5
    rotation?: number; // default: dependent on chart type. Overridden for default category

    // A custom formatter function for the axis labels.
    // The value is either a category name or a number. If it's the latter, the number
    // of fractional digits used by the axis step will be provided as well.
    formatter?: (value: any, fractionDigits?: number) => string;
}

interface GridStyle {
    stroke: string; // default: dependent on light/dark mode

    // The line dash array. Every number in the array specifies the length of alternating
    // dashes and gaps. For example, [6, 3] means dash of length 6 and gap of length 3.
    // If undefined, a solid line will be used.
    lineDash?: number[]; // default: [4, 2]
}

interface FillOptions {
    colors: string[]; // default: dependent on selected palette

    // Valid range from 0 (transparent) to 1 (opaque)
    opacity: number; // default: 1
}

interface StrokeOptions {
    colors: string[]; // default: dependent on selected palette

    // Valid range from 0 (transparent) to 1 (opaque)
    opacity: number; // default: 1

    width: number; // default: 1
}

interface HighlightOptions {
    fill?: string;
    stroke?: string;
}

interface MarkerOptions {
    enabled: boolean; // default: true
    size: number; // default: 6
    strokeWidth: number; // default: 1
}

interface TooltipOptions {
    enabled: boolean; // default: true
    renderer?: (params: LineTooltipRendererParams) => string; // should return a valid HTML string
}

interface LineTooltipRendererParams {
    // The datum object for the highlighted marker that the tooltip is being rendered for
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

<h3>Example: Line Chart Customisations</h3>

<p>
    The example below changes all available styling options. The styling options are exaggerated
    to demonstrate each option rather than to produce a chart that looks nice!
</p>

<?= example('Line Chart Customisations', 'custom-line-chart', 'generated', array("enterprise" => true)) ?>

<?php include '../documentation-main/documentation_footer.php'; ?>
