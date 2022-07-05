import { AgCartesianAxisOptions, AgScatterSeriesOptions, ChartAxisPosition } from "ag-charts-community";
import { ChartProxyParams, FieldDefinition, UpdateChartParams } from "../chartProxy";
import { CartesianChartProxy } from "./cartesianChartProxy";
import { deepMerge } from "../../utils/object";
import { ChartDataModel } from "../../chartDataModel";
import { AgScatterSeriesMarker } from "ag-charts-community/src/chart/agChartOptions";

interface SeriesDefinition {
    xField: FieldDefinition;
    yField: FieldDefinition;
    sizeField?: FieldDefinition;
}

export class ScatterChartProxy extends CartesianChartProxy {

    public constructor(params: ChartProxyParams) {
        super(params);

        this.supportsAxesUpdates = false;
        this.xAxisType = 'number';
        this.yAxisType = 'number';

        this.recreateChart();
    }

    public getData(params: UpdateChartParams): any[] {
        return this.getDataTransformedData(params);
    }

    public getAxes(): AgCartesianAxisOptions[] {
        const axisOptions = this.getAxesOptions();
        return [
            {
                ...deepMerge(axisOptions[this.xAxisType], axisOptions[this.xAxisType].bottom),
                type: this.xAxisType,
                position: ChartAxisPosition.Bottom,
            },
            {
                ...deepMerge(axisOptions[this.yAxisType], axisOptions[this.yAxisType].left),
                type: this.yAxisType,
                position: ChartAxisPosition.Left,
            },
        ];
    }

    public getSeries(params: UpdateChartParams): AgScatterSeriesOptions[] {
        const paired = this.chartOptions[this.standaloneChartType].paired;
        const seriesDefinitions = this.getSeriesDefinitions(params.fields, paired);
        const labelFieldDefinition = params.category.id === ChartDataModel.DEFAULT_CATEGORY ? undefined : params.category;

        const series: AgScatterSeriesOptions[] = seriesDefinitions.map(seriesDefinition => (
            {
                ...this.extractSeriesOverrides(),
                type: this.standaloneChartType,
                xKey: seriesDefinition!.xField.colId,
                xName: seriesDefinition!.xField.displayName,
                yKey: seriesDefinition!.yField.colId,
                yName: seriesDefinition!.yField.displayName,
                title: `${seriesDefinition!.yField.displayName} vs ${seriesDefinition!.xField.displayName}`,
                sizeKey: seriesDefinition!.sizeField ? seriesDefinition!.sizeField.colId : undefined,
                sizeName: seriesDefinition!.sizeField ? seriesDefinition!.sizeField.displayName : undefined,
                labelKey: labelFieldDefinition ? labelFieldDefinition.id : seriesDefinition!.yField.colId,
                labelName: labelFieldDefinition ? labelFieldDefinition.name : undefined,
            }
        ));

        return this.crossFiltering ? this.extractCrossFilterSeries(series, params) : series;
    }

    private extractCrossFilterSeries(
        series: AgScatterSeriesOptions[],
        params: UpdateChartParams,
    ): AgScatterSeriesOptions[] {
        const { data } = params;

        return series.concat(...series.map((series) => {
            let markerDomain: [number, number] = [Infinity, -Infinity];
            if (series.sizeKey != null) {
                for (const datum of data) {
                    const value = datum[series.sizeKey];
                    if (value < markerDomain[0]) {
                        markerDomain[0] = value;
                    }
                    if (value > markerDomain[1]) {
                        markerDomain[1] = value;
                    }
                }
            }
            console.log({markerDomain});

            const seriesOverrides = this.extractSeriesOverrides();
            const marker: AgScatterSeriesMarker = {
                formatter: (p: any) => {
                    return {
                        fill: p.highlighted ? 'yellow' : p.fill,
                    };
                },
                fillOpacity: this.crossFilteringDeselectedPoints() ? 0.3 : 1,
                strokeOpacity: this.crossFilteringDeselectedPoints() ? 0.3 : 1,
            };
            if (markerDomain[0] <= markerDomain[1]) {
                marker.domain = markerDomain;
            }
            return {
                ...series,
                marker,
                yKey: series.yKey + '-filtered-out',
                xKey: series.xKey + '-filtered-out',
                listeners: {
                    ...seriesOverrides.listeners,
                    nodeClick: (e: any) => {
                        const value = e.datum![series.xKey!];
                        const multiSelection = e.event.metaKey || e.event.ctrlKey;
                        this.crossFilteringAddSelectedPoint(multiSelection, value);
                        this.crossFilterCallback(e);
                    }
                },
                showInLegend: false,
            };
        }));
    }

    private getSeriesDefinitions(fields: FieldDefinition[], paired: boolean): (SeriesDefinition | null)[] {
        if (fields.length < 2) { return []; }

        const isBubbleChart = this.chartType === 'bubble';

        if (paired) {
            if (isBubbleChart) {
                return fields.map((currentXField, i) => i % 3 === 0 ? ({
                    xField: currentXField,
                    yField: fields[i + 1],
                    sizeField: fields[i + 2],
                }) : null).filter(x => x && x.yField && x.sizeField);
            }
            return fields.map((currentXField, i) => i % 2 === 0 ? ({
                xField: currentXField,
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