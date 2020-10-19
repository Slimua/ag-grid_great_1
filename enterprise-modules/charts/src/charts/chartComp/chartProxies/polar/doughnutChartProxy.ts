import {AgChart, AgPieSeriesOptions, AgPolarChartOptions, ChartTheme, PieSeries, PolarChart} from "ag-charts-community";
import {_, HighlightOptions, PieSeriesOptions, PolarChartOptions} from "@ag-grid-community/core";
import {ChartProxyParams, UpdateChartParams} from "../chartProxy";
import {PolarChartProxy} from "./polarChartProxy";

export class DoughnutChartProxy extends PolarChartProxy {

    public constructor(params: ChartProxyParams) {
        super(params);

        this.initChartOptions();
        this.recreateChart();
    }

    protected getDefaultOptionsFromTheme(theme: ChartTheme): PolarChartOptions<PieSeriesOptions> {
        const options = super.getDefaultOptionsFromTheme(theme);

        const seriesDefaults = theme.getConfig<AgPieSeriesOptions>('pie.series.pie');
        options.seriesDefaults = {
            title: seriesDefaults.title,
            label: {
                ...seriesDefaults.label,
                minRequiredAngle: seriesDefaults.label.minAngle
            },
            callout: seriesDefaults.callout,
            shadow: seriesDefaults.shadow,
            tooltip: {
                enabled: seriesDefaults.tooltipEnabled,
                renderer: seriesDefaults.tooltipRenderer
            },
            fill: {
                colors: theme.palette.fills,
                opacity: seriesDefaults.fillOpacity
            },
            stroke: {
                colors: theme.palette.strokes,
                opacity: seriesDefaults.strokeOpacity,
                width: seriesDefaults.strokeWidth
            },
            lineDash: seriesDefaults.lineDash,
            lineDashOffset: seriesDefaults.lineDashOffset,
            highlightStyle: seriesDefaults.highlightStyle as HighlightOptions,
        } as PieSeriesOptions;

        return options;
    }

    protected createChart(options?: PolarChartOptions<PieSeriesOptions>): PolarChart {
        options = options || this.chartOptions;
        const agChartOptions = options as AgPolarChartOptions;
        agChartOptions.type = 'pie';
        agChartOptions.autoSize = true;
        agChartOptions.series = [];

        return AgChart.create(agChartOptions, this.chartProxyParams.parentElement);
    }

    public update(params: UpdateChartParams): void {
        if (params.fields.length === 0) {
            this.chart.removeAllSeries();
            return;
        }

        const doughnutChart = this.chart;
        const fieldIds = params.fields.map(f => f.colId);
        const seriesMap: { [id: string]: PieSeries } = {};

        doughnutChart.series.forEach((series: PieSeries) => {
            const pieSeries = series;
            const id = pieSeries.angleKey;

            if (_.includes(fieldIds, id)) {
                seriesMap[id] = pieSeries;
            }
        });

        const { seriesDefaults } = this.chartOptions;
        const { fills, strokes } = this.getPalette();
        let offset = 0;

        params.fields.forEach((f, index) => {
            const existingSeries = seriesMap[f.colId];

            const seriesOptions: AgPieSeriesOptions = {
                ...seriesDefaults,
                type: 'pie',
                angleKey: f.colId,
                showInLegend: index === 0, // show legend items for the first series only
                title: {
                    ...seriesDefaults.title,
                    text: seriesDefaults.title.text || f.displayName,
                },
                fills: seriesDefaults.fill.colors,
                fillOpacity: seriesDefaults.fill.opacity,
                strokes: seriesDefaults.stroke.colors,
                strokeOpacity: seriesDefaults.stroke.opacity,
                strokeWidth: seriesDefaults.stroke.width,
                tooltipRenderer: seriesDefaults.tooltip && seriesDefaults.tooltip.enabled && seriesDefaults.tooltip.renderer,
            };

            const calloutColors = seriesOptions.callout && seriesOptions.callout.colors;
            const pieSeries = existingSeries || AgChart.createComponent(seriesOptions, 'pie.series') as PieSeries;

            pieSeries.angleName = f.displayName;
            pieSeries.labelKey = params.category.id;
            pieSeries.labelName = params.category.name;
            pieSeries.data = params.data;
            pieSeries.fills = fills;
            pieSeries.strokes = strokes;

            // Normally all series provide legend items for every slice.
            // For our use case, where all series have the same number of slices in the same order with the same labels
            // (all of which can be different in other use cases) we don't want to show repeating labels in the legend,
            // so we only show legend items for the first series, and then when the user toggles the slices of the
            // first series in the legend, we programmatically toggle the corresponding slices of other series.
            if (index === 0) {
                pieSeries.toggleSeriesItem = (itemId: any, enabled: boolean) => {
                    if (doughnutChart) {
                        doughnutChart.series.forEach((series: any) => {
                            (series as PieSeries).seriesItemEnabled[itemId] = enabled;
                        });
                    }

                    pieSeries.scheduleData();
                };
            }

            pieSeries.outerRadiusOffset = offset;
            offset -= 20;
            pieSeries.innerRadiusOffset = offset;
            offset -= 20;

            if (calloutColors) {
                pieSeries.callout.colors = strokes;
            }

            if (!existingSeries) {
                seriesMap[f.colId] = pieSeries;
            }
        });

        // Because repaints are automatic, it's important to remove/add/update series at once,
        // so that we don't get painted twice.
        doughnutChart.series = _.values(seriesMap);
    }

    protected getDefaultOptions(): PolarChartOptions<PieSeriesOptions> {
        const { strokes } = this.getPredefinedPalette();
        const options = this.getDefaultChartOptions() as PolarChartOptions<PieSeriesOptions>;
        const fontOptions = this.getDefaultFontOptions();

        options.seriesDefaults = {
            ...options.seriesDefaults,
            title: {
                ...fontOptions,
                enabled: true,
                fontSize: 12,
                fontWeight: 'bold',
            },
            callout: {
                colors: strokes,
                length: 10,
                strokeWidth: 2,
            },
            label: {
                ...fontOptions,
                enabled: false,
                offset: 3,
                minRequiredAngle: 0,
            },
            tooltip: {
                enabled: true,
            },
            shadow: this.getDefaultDropShadowOptions(),
        };

        return options;
    }
}
