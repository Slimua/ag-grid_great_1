import {
    _,
    AgScatterSeriesOptions,
    CartesianChartOptions,
    ChartType,
    HighlightOptions,
    ScatterSeriesOptions
} from "@ag-grid-community/core";
import {AgCartesianChartOptions, AgChart, CartesianChart, ChartTheme, ScatterSeries} from "ag-charts-community";
import {ChartProxyParams, FieldDefinition, UpdateChartParams} from "../chartProxy";
import {ChartDataModel} from "../../chartDataModel";
import {CartesianChartProxy} from "./cartesianChartProxy";

interface SeriesDefinition {
    xField: FieldDefinition;
    yField: FieldDefinition;
    sizeField?: FieldDefinition;
}

export class ScatterChartProxy extends CartesianChartProxy<ScatterSeriesOptions> {

    public constructor(params: ChartProxyParams) {
        super(params);

        this.initChartOptions();
        this.recreateChart();
    }

    protected getDefaultOptionsFromTheme(theme: ChartTheme): CartesianChartOptions<ScatterSeriesOptions> {
        const options = super.getDefaultOptionsFromTheme(theme);

        const seriesDefaults = theme.getConfig<AgScatterSeriesOptions>('scatter.series.scatter');
        options.seriesDefaults = {
            tooltip: {
                enabled: seriesDefaults.tooltipEnabled,
                renderer: seriesDefaults.tooltipRenderer
            },
            fill: {
                colors: theme.palette.fills,
                opacity: seriesDefaults.fillOpacity,
            },
            stroke: {
                colors: theme.palette.strokes,
                opacity: seriesDefaults.strokeOpacity,
                width: seriesDefaults.strokeWidth
            },
            marker: {
                enabled: seriesDefaults.marker.enabled,
                shape: seriesDefaults.marker.shape,
                size: seriesDefaults.marker.size,
                strokeWidth: seriesDefaults.marker.strokeWidth
            },
            highlightStyle: seriesDefaults.highlightStyle as HighlightOptions,
            paired: true
        } as ScatterSeriesOptions;

        return options;
    }

    protected createChart(options?: CartesianChartOptions<ScatterSeriesOptions>): CartesianChart {
        options = options || this.chartOptions;
        const agChartOptions = options as AgCartesianChartOptions;
        agChartOptions.autoSize = true;
        agChartOptions.axes = [{
            type: 'number',
            position: 'bottom',
            ...options.xAxis,
        }, {
            type: 'number',
            position: 'left',
            ...options.yAxis,
        }];

        return AgChart.create(agChartOptions, this.chartProxyParams.parentElement);
    }

    public update(params: UpdateChartParams): void {
        if (params.fields.length < 2) {
            this.chart.removeAllSeries();
            return;
        }

        const { fields } = params;
        const { seriesDefaults } = this.chartOptions as any;
        const seriesDefinitions = this.getSeriesDefinitions(fields, seriesDefaults.paired);

        const { chart } = this;

        const existingSeriesById = (chart.series as ScatterSeries[]).reduceRight((map, series, i) => {
            const matchingIndex = _.findIndex(seriesDefinitions, (s: any) =>
                s.xField.colId === series.xKey &&
                s.yField.colId === series.yKey &&
                ((!s.sizeField && !series.sizeKey) || (s.sizeField && s.sizeField.colId === series.sizeKey)));

            if (matchingIndex === i) {
                map.set(series.yKey, series);
            } else {
                chart.removeSeries(series);
            }

            return map;
        }, new Map<string, ScatterSeries>());

        const { fills, strokes } = this.getPalette();
        const labelFieldDefinition = params.category.id === ChartDataModel.DEFAULT_CATEGORY ? undefined : params.category;
        let previousSeries: ScatterSeries | undefined;

        seriesDefinitions.forEach((seriesDefinition, index) => {
            const existingSeries = existingSeriesById.get(seriesDefinition.yField.colId);
            const marker = { ...seriesDefaults.marker };
            if (marker.type) { // deprecated
                marker.shape = marker.type;
                delete marker.type;
            }
            const series = existingSeries || AgChart.createComponent({
                ...seriesDefaults,
                type: 'scatter',
                fillOpacity: seriesDefaults.fill.opacity,
                strokeOpacity: seriesDefaults.stroke.opacity,
                strokeWidth: seriesDefaults.stroke.width,
                marker,
                tooltipRenderer: seriesDefaults.tooltip && seriesDefaults.tooltip.enabled && seriesDefaults.tooltip.renderer,
            }, 'scatter.series');

            if (!series) {
                return;
            }

            const {
                xField: xFieldDefinition,
                yField: yFieldDefinition,
                sizeField: sizeFieldDefinition
            } = seriesDefinition;

            series.title = `${yFieldDefinition.displayName} vs ${xFieldDefinition.displayName}`;
            series.xKey = xFieldDefinition.colId;
            series.xName = xFieldDefinition.displayName;
            series.yKey = yFieldDefinition.colId;
            series.yName = yFieldDefinition.displayName;
            series.data = params.data;
            series.fill = fills[index % fills.length];
            series.stroke = strokes[index % strokes.length];

            if (sizeFieldDefinition) {
                series.sizeKey = sizeFieldDefinition.colId;
                series.sizeName = sizeFieldDefinition.displayName;
            } else {
                series.sizeKey = series.sizeName = undefined;
            }

            if (labelFieldDefinition) {
                series.labelKey = labelFieldDefinition.id;
                series.labelName = labelFieldDefinition.name;
            } else {
                series.labelKey = series.labelName = undefined;
            }

            if (!existingSeries) {
                chart.addSeriesAfter(series, previousSeries);
            }

            previousSeries = series;
        });
    }

    public getTooltipsEnabled(): boolean {
        return this.chartOptions.seriesDefaults.tooltip != null && !!this.chartOptions.seriesDefaults.tooltip.enabled;
    }

    public getMarkersEnabled = (): boolean => true; // markers are always enabled on scatter charts

    protected getDefaultOptions(): CartesianChartOptions<ScatterSeriesOptions> {
        const isBubble = this.chartType === ChartType.Bubble;
        const options = this.getDefaultCartesianChartOptions() as CartesianChartOptions<ScatterSeriesOptions>;

        options.seriesDefaults = {
            ...options.seriesDefaults,
            fill: {
                ...options.seriesDefaults.fill,
                opacity: isBubble ? 0.7 : 1,
            },
            stroke: {
                ...options.seriesDefaults.stroke,
                width: 3,
            },
            marker: {
                shape: 'circle',
                enabled: true,
                size: 6,
                maxSize: 30,
                strokeWidth: 1,
            },
            tooltip: {
                enabled: true,
            },
            paired: true,
        };

        return options;
    }

    private getSeriesDefinitions(fields: FieldDefinition[], paired: boolean): SeriesDefinition[] {
        if (fields.length < 2) { return []; }

        const isBubbleChart = this.chartType === ChartType.Bubble;

        if (paired) {
            if (isBubbleChart) {
                return fields.map((currentxField, i) => i % 3 === 0 ? ({
                    xField: currentxField,
                    yField: fields[i + 1],
                    sizeField: fields[i + 2],
                }) : null).filter(x => x && x.yField && x.sizeField);
            }
            return fields.map((currentxField, i) => i % 2 === 0 ? ({
                xField: currentxField,
                yField: fields[i + 1],
            }) : null).filter(x => x && x.yField);
        }

        const xField = fields[0];

        if (isBubbleChart) {
            return fields
                .map((yField, i) => i % 2 === 1 ? ({
                    xField,
                    yField,
                    sizeField: fields[i + 1],
                }) : null)
                .filter(x => x && x.sizeField);
        }

        return fields.filter((value, i) => i > 0).map(yField => ({ xField, yField }));
    }
}