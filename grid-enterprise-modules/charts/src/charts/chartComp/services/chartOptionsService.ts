import { _, BeanStub, ChartOptionsChanged, ChartType, Events, WithoutGridCommon } from "@ag-grid-community/core";
import { AgCartesianAxisType, AgCharts, AgChartOptions, AgPolarAxisType } from "ag-charts-community";

import { ChartController } from "../chartController";
import { AgChartActual } from "../utils/integration";
import { deepMerge } from "../utils/object";
import { ChartSeriesType, VALID_SERIES_TYPES } from "../utils/seriesTypeMapper";

type ChartAxis = NonNullable<AgChartActual['axes']>[number];
type SupportedSeries = AgChartActual['series'][number];
export class ChartOptionsService extends BeanStub {
    private readonly chartController: ChartController;

    constructor(chartController: ChartController) {
        super();
        this.chartController = chartController;
    }

    public getChartOption<T = string>(expression: string): T {
        return _.get(this.getChart(), expression, undefined) as T;
    }

    public setChartOption<T = string>(expression: string, value: T, isSilent?: boolean): void {
        const chartSeriesTypes = this.chartController.getChartSeriesTypes();
        if (this.chartController.isComboChart()) {
            chartSeriesTypes.push('common');
        }

        let chartOptions = {};
        // we need to update chart options on each series type for combo charts
        chartSeriesTypes.forEach(seriesType => {
            chartOptions = deepMerge(chartOptions, this.createChartOptions<T>({
                seriesType,
                expression,
                value
            }));
        });

        if (!isSilent) {
            this.updateChart(chartOptions);
            this.raiseChartOptionsChangedEvent();
        }
    }

    public awaitChartOptionUpdate(func: () => void) {
        const chart = this.chartController.getChartProxy().getChart();
        chart.waitForUpdate().then(() => func())
            .catch((e) => console.error(`AG Grid - chart update failed`, e));
    }

    public getAxisProperty<T = string>(expression: string): T {
        return this.getPrimaryAxisProperty(expression);
    }

    public setAxisProperty<T = string>(expression: string, value: T) {
        // update axis options for all axes simultaneously
        const chart = this.getChart();
        let chartOptions = {};
        chart.axes?.forEach((axis: any) => {
            chartOptions = deepMerge(chartOptions, this.getUpdateAxisOptions<T>(axis, expression, value));
        });

        this.updateChart(chartOptions);
        this.raiseChartOptionsChangedEvent();
    }
    
    public getPrimaryAxisProperty<T = string>(expression: string): T {
        return this.getIndexedAxisProperty(0, expression);
    }

    public getSecondaryAxisProperty<T = string>(expression: string): T {
        return this.getIndexedAxisProperty(1, expression);
    }
    
    public getCategoryAxisProperty<T = string>(expression: string): T | undefined {
        const axisIndex = this.getCategoryAxisIndex();
        if (axisIndex == undefined) return undefined;
        return this.getIndexedAxisProperty(axisIndex, expression);
    }

    public getRadiusAxisProperty<T = string>(expression: string): T | undefined {
        const axisIndex = this.getRadiusAxisIndex();
        if (axisIndex == undefined) return undefined;
        return this.getIndexedAxisProperty(axisIndex, expression);
    }

    public getAngleAxisProperty<T = string>(expression: string): T | undefined {
        const axisIndex = this.getAngleAxisIndex();
        if (axisIndex == undefined) return undefined;
        return this.getIndexedAxisProperty(axisIndex, expression);
    }

    public setPrimaryAxisProperty<T = string>(expression: string, value: T) {
        return this.setIndexedAxisProperty(0, expression, value);
    }

    public setSecondaryAxisProperty<T = string>(expression: string, value: T) {
        return this.setIndexedAxisProperty(1, expression, value);
    }

    public setCategoryAxisProperty<T = string>(expression: string, value: T) {
        const axisIndex = this.getCategoryAxisIndex();
        if (axisIndex == undefined) return;
        return this.setIndexedAxisProperty(axisIndex, expression, value);
    }

    public setRadiusAxisProperty<T = string>(expression: string, value: T) {
        const axisIndex = this.getRadiusAxisIndex();
        if (axisIndex == undefined) return;
        return this.setIndexedAxisProperty(axisIndex, expression, value);
    }

    public setAngleAxisProperty<T = string>(expression: string, value: T) {
        const axisIndex = this.getAngleAxisIndex();
        if (axisIndex == undefined) return;
        return this.setIndexedAxisProperty(axisIndex, expression, value);
    }

    private getCategoryAxisIndex(): number | undefined {
        // Locate the first matching category axis
        return this.findAxisIndex((axis) => {
            switch (axis.type) {
                case 'category':
                case 'grouped-category':
                case 'radius-category':
                case 'angle-category':
                    return true;
                default:
                    return false;
            }
        });
    }

    private getRadiusAxisIndex(): number | undefined {
        // Locate the first matching angle axis
        return this.findAxisIndex((axis) => {
            switch (axis.type) {
                case 'radius-category':
                case 'radius-number':
                    return true;
                default:
                    return false;
            }
        });
    }

    private getAngleAxisIndex(): number | undefined {
        // Locate the first matching angle axis
        return this.findAxisIndex((axis) => {
            switch (axis.type) {
                case 'angle-category':
                case 'angle-number':
                    return true;
                default:
                    return false;
            }
        });
    }

    private findAxisIndex(predicate: (axis: NonNullable<AgChartActual['axes']>[number]) => boolean): number | undefined {
        // Locate the first matching axis
        const index = this.getChart().axes?.findIndex((axis) => predicate(axis));
        return (index === -1 ? undefined : index);
    }

    private getIndexedAxisProperty<T>(axisIndex: number, expression: string): T {
        return _.get(this.getChart().axes?.[axisIndex], expression, undefined) as T;
    }

    private setIndexedAxisProperty<T>(axisIndex: number, expression: string, value: T) {
        // update axis options
        const chart = this.getChart();
        const axis = chart.axes?.[axisIndex];
        if (!axis) return;

        const chartOptions = this.getUpdateAxisOptions<T>(axis, expression, value);

        this.updateChart(chartOptions);
        this.raiseChartOptionsChangedEvent();
    }

    public getLabelRotation(axisType: 'xAxis' | 'yAxis'): number {
        const axis = this.getAxis(axisType);
        return _.get(axis, 'label.rotation', undefined);
    }

    public setLabelRotation(axisType: 'xAxis' | 'yAxis', value: number | undefined) {
        const chartAxis = this.getAxis(axisType);
        if (chartAxis) {
            const chartOptions = this.getUpdateAxisOptions(chartAxis, 'label.rotation', value);
            this.updateChart(chartOptions);
            this.raiseChartOptionsChangedEvent();
        }
    }

    public getSeriesOption<T = string>(expression: string, seriesType: ChartSeriesType, calculated?: boolean): T {
        // N.B. 'calculated' here refers to the fact that the property exists on the internal series object itself,
        // rather than the properties object. This is due to us needing to reach inside the chart itself to retrieve
        // the value, and will likely be cleaned up in a future release
        const series = this.getChart().series.find((s: any) => ChartOptionsService.isMatchingSeries(seriesType, s));
        return _.get(calculated ? series : series?.properties.toJson(), expression, undefined) as T;
    }

    public setSeriesOption<T = string>(expression: string, value: T, seriesType: ChartSeriesType): void {
        const chartOptions = this.createChartOptions<T>({
            seriesType,
            expression: `series.${expression}`,
            value
        });
        this.updateChart(chartOptions);

        this.raiseChartOptionsChangedEvent();
    }

    public getPairedMode(): boolean {
        return this.chartController.getChartProxy().isPaired();
    }

    public setPairedMode(paired: boolean): void {
        this.chartController.getChartProxy().setPaired(paired);
    }

    private getAxis(axisType: string): ChartAxis | undefined {
        const chart = this.getChart();
        if (!chart.axes || chart.axes.length < 1) { return undefined; }

        if (axisType === 'xAxis') {
            return (chart.axes && chart.axes[0].direction === 'x') ? chart.axes[0] : chart.axes[1];
        }
        return (chart.axes && chart.axes[1].direction === 'y') ? chart.axes[1] : chart.axes[0];
    }

    private getUpdateAxisOptions<T = string>(chartAxis: ChartAxis, expression: string, value: T): AgChartOptions {
        const chartSeriesTypes = this.chartController.getChartSeriesTypes();
        if (this.chartController.isComboChart()) {
            chartSeriesTypes.push('common');
        }

        const validAxisTypes: (AgCartesianAxisType | AgPolarAxisType)[] = ['number', 'category', 'time', 'grouped-category', 'angle-category', 'angle-number', 'radius-category', 'radius-number'];

        if (!validAxisTypes.includes(chartAxis.type)) {
            return {};
        }

        return chartSeriesTypes
            .map((seriesType) => this.createChartOptions<T>({
                seriesType,
                expression: `axes.${chartAxis.type}.${expression}`,
                value,
            }))
            .reduce((combinedOptions, options) => deepMerge(combinedOptions, options));
    }

    public getChartType(): ChartType {
        return this.chartController.getChartType();
    }

    private getChart() {
        return this.chartController.getChartProxy().getChart();
    }

    private updateChart(chartOptions: AgChartOptions) {
        const chartRef = this.chartController.getChartProxy().getChartRef();
        AgCharts.updateDelta(chartRef, chartOptions);
    }

    private createChartOptions<T>({ seriesType, expression, value }: {
        seriesType: ChartSeriesType,
        expression: string,
        value: T
    }): AgChartOptions {
        const overrides = {};
        const chartOptions = {
            theme: {
                overrides
            }
        };
        _.set(overrides, `${seriesType}.${expression}`, value);

        return chartOptions;
    }

    private raiseChartOptionsChangedEvent(): void {
        const chartModel = this.chartController.getChartModel();

        const event: WithoutGridCommon<ChartOptionsChanged> = {
            type: Events.EVENT_CHART_OPTIONS_CHANGED,
            chartId: chartModel.chartId,
            chartType: chartModel.chartType,
            chartThemeName: this.chartController.getChartThemeName(),
            chartOptions: chartModel.chartOptions
        };

        this.eventService.dispatchEvent(event);
    }

    private static isMatchingSeries(seriesType: ChartSeriesType, series: SupportedSeries): boolean {
        return VALID_SERIES_TYPES.includes(seriesType) && series.type === seriesType;
    }

    protected destroy(): void {
        super.destroy();
    }
}
