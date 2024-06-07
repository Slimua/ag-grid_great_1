import type { AgSelectParams, BeanCollection } from '@ag-grid-community/core';
import { AgSelect, Component, RefPlaceholder, _includes } from '@ag-grid-community/core';
import type { AgGroupComponentParams } from '@ag-grid-enterprise/core';
import { AgGroupComponent } from '@ag-grid-enterprise/core';

import type { AgSliderParams } from '../../../../../widgets/agSlider';
import { AgSlider } from '../../../../../widgets/agSlider';
import type { ChartOptionsService } from '../../../services/chartOptionsService';
import type { ChartTranslationKey, ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class MarkersPanel extends Component {
    public static TEMPLATE /* html */ = `<div>
            <ag-group-component data-ref="seriesMarkersGroup">
                <ag-select data-ref="seriesMarkerShapeSelect"></ag-select>
                <ag-slider data-ref="seriesMarkerMinSizeSlider"></ag-slider>
                <ag-slider data-ref="seriesMarkerSizeSlider"></ag-slider>
                <ag-slider data-ref="seriesMarkerStrokeWidthSlider"></ag-slider>
            </ag-group-component>
        </div>`;

    private readonly seriesMarkerMinSizeSlider: AgSlider = RefPlaceholder;

    private chartTranslationService: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslationService = beans.chartTranslationService as ChartTranslationService;
    }
    constructor(
        private readonly chartOptionsService: ChartOptionsService,
        private readonly chartMenuUtils: ChartMenuParamsFactory
    ) {
        super();
    }

    public postConstruct() {
        // scatter charts should always show markers
        const chartType = this.chartOptionsService.getChartType();
        const shouldHideEnabledCheckbox = _includes(['scatter', 'bubble'], chartType);
        const seriesMarkersGroupParams = this.chartMenuUtils.addEnableParams<AgGroupComponentParams>('marker.enabled', {
            cssIdentifier: 'charts-format-sub-level',
            direction: 'vertical',
            title: this.chartTranslationService.translate('markers'),
            suppressEnabledCheckbox: true,
            useToggle: !shouldHideEnabledCheckbox,
            suppressOpenCloseIcons: true,
        });

        const isBubble = chartType === 'bubble';
        let seriesMarkerMinSizeSliderParams: AgSliderParams;
        let seriesMarkerSizeSliderParams: AgSliderParams;
        if (isBubble) {
            seriesMarkerMinSizeSliderParams = this.getSliderParams('marker.maxSize', 'maxSize', 60);
            seriesMarkerSizeSliderParams = this.getSliderParams('marker.size', 'minSize', 60);
        } else {
            seriesMarkerMinSizeSliderParams = {};
            seriesMarkerSizeSliderParams = this.getSliderParams('marker.size', 'size', 60);
        }

        this.setTemplate(MarkersPanel.TEMPLATE, [AgGroupComponent, AgSelect, AgSlider], {
            seriesMarkersGroup: seriesMarkersGroupParams,
            seriesMarkerShapeSelect: this.getMarkerShapeSelectParams(),
            seriesMarkerMinSizeSlider: seriesMarkerMinSizeSliderParams,
            seriesMarkerSizeSlider: seriesMarkerSizeSliderParams,
            seriesMarkerStrokeWidthSlider: this.getSliderParams('marker.strokeWidth', 'strokeWidth', 10),
        });
        if (!isBubble) {
            this.seriesMarkerMinSizeSlider.setDisplayed(false);
        }
    }

    private getMarkerShapeSelectParams(): AgSelectParams {
        const options = [
            {
                value: 'square',
                text: 'Square',
            },
            {
                value: 'circle',
                text: 'Circle',
            },
            {
                value: 'cross',
                text: 'Cross',
            },
            {
                value: 'diamond',
                text: 'Diamond',
            },
            {
                value: 'plus',
                text: 'Plus',
            },
            {
                value: 'triangle',
                text: 'Triangle',
            },
            {
                value: 'heart',
                text: 'Heart',
            },
        ];
        return this.chartMenuUtils.getDefaultSelectParams('marker.shape', 'shape', options);
    }

    private getSliderParams(
        expression: string,
        labelKey: ChartTranslationKey,
        defaultMaxValue: number
    ): AgSliderParams {
        return this.chartMenuUtils.getDefaultSliderParams(expression, labelKey, defaultMaxValue);
    }
}
