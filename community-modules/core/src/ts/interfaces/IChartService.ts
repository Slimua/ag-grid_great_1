import { ChartType, SeriesChartType } from "./iChartOptions";
import { ChartRef } from "../entities/gridOptions";
import { CreateCrossFilterChartParams, CreatePivotChartParams, CreateRangeChartParams } from "../gridApi";
import { CellRangeParams } from "./IRangeService";
import { IAggFunc } from "../entities/colDef";
import { AgChartThemeOverrides, AgChartThemePalette } from "./iAgChartOptions";

export interface GetChartImageDataUrlParams {
    /** The id of the created chart. */
    chartId: string;

    /**
     * A string indicating the image format.
     * The default format type is `image/png`.
     * Options: `image/png`, `image/jpeg`
     */
    fileFormat?: string;
}

export interface ChartDownloadParams {
    /** The id of the created chart. */
    chartId: string;

    /** Name of downloaded image file. The chart title will be used by default */
    fileName?: string;

    /**
     * A string indicating the image format.
     * The default format type is `image/png`.
     * Options: `image/png`, `image/jpeg`
     */
    fileFormat?: string;

    /**
     * Dimensions of downloaded chart. The current chart dimensions will be used if not specified.
     */
    dimensions?: {
        width: number,
        height: number
    }
}

export interface CloseChartsToolPanelParams {
    /** The id of the created chart. */
    chartId: string;
}

export type ChartModelType = 'range' | 'pivot';

export type ChartsToolPanelTabs = 'settings' | 'data' | 'format'

export interface OpenChartsToolPanelParams {
    /** The id of the created chart. */
    chartId: string;
    
    /** Tab name of the charts tool panel. The default settings tab will be used if not specified.*/
    tabName?: ChartsToolPanelTabs;
}

export interface ChartModel {
    version?: string;
    modelType: ChartModelType;
    chartId: string;
    chartType: ChartType;
    cellRange: CellRangeParams;
    chartThemeName?: string;
    chartOptions: AgChartThemeOverrides;
    chartPalette?: AgChartThemePalette;
    suppressChartRanges?: boolean;
    aggFunc?: string | IAggFunc;
    unlinkChart?: boolean;
    seriesChartTypes?: SeriesChartType[];
}

export interface IChartService {
    getChartModels(): ChartModel[];
    getChartRef(chartId: string): ChartRef | undefined;
    createRangeChart(params: CreateRangeChartParams): ChartRef | undefined;
    createCrossFilterChart(params: CreateCrossFilterChartParams): ChartRef | undefined;
    createChartFromCurrentRange(chartType: ChartType): ChartRef | undefined;
    createPivotChart(params: CreatePivotChartParams): ChartRef | undefined;
    restoreChart(model: ChartModel, chartContainer?: HTMLElement): ChartRef | undefined;
    getChartImageDataURL(params: GetChartImageDataUrlParams): string | undefined;
    downloadChart(params: ChartDownloadParams): void;
    openChartsToolPanel(params: OpenChartsToolPanelParams): void;
    closeChartsToolPanel(chartId: string): void;
}