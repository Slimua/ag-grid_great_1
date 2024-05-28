import type { BeanCollection } from '@ag-grid-community/core';
import { AgCheckbox, Component } from '@ag-grid-community/core';
import type { AgGroupComponentParams } from '@ag-grid-enterprise/core';
import { AgGroupComponent } from '@ag-grid-enterprise/core';

import { AgSlider } from '../../../../../widgets/agSlider';
import type { ChartTranslationService } from '../../../services/chartTranslationService';
import type { ChartMenuParamsFactory } from '../../chartMenuParamsFactory';

export class NavigatorPanel extends Component {
    public static TEMPLATE /* html */ = `<div>
            <ag-group-component data-ref="navigatorGroup">
                <ag-slider data-ref="navigatorHeightSlider"></ag-slider>
                <ag-checkbox data-ref="navigatorMiniChartCheckbox"></ag-checkbox>
            </ag-group-component>
        </div>`;

    private chartTranslationService: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        super.wireBeans(beans);
        this.chartTranslationService = beans.chartTranslationService;
    }

    constructor(private readonly chartMenuParamsFactory: ChartMenuParamsFactory) {
        super();
    }

    public postConstruct() {
        const navigatorGroupParams = this.chartMenuParamsFactory.addEnableParams<AgGroupComponentParams>(
            'navigator.enabled',
            {
                cssIdentifier: 'charts-advanced-settings-top-level',
                direction: 'vertical',
                suppressOpenCloseIcons: true,
                title: this.chartTranslationService.translate('navigator'),
                suppressEnabledCheckbox: true,
                useToggle: true,
            }
        );
        const navigatorHeightSliderParams = this.chartMenuParamsFactory.getDefaultSliderParams(
            'navigator.height',
            'height',
            60
        );
        navigatorHeightSliderParams.minValue = 10;
        const navigatorMiniChartCheckboxParams = this.chartMenuParamsFactory.getDefaultCheckboxParams(
            'navigator.miniChart.enabled',
            'miniChart'
        );

        this.setTemplate(NavigatorPanel.TEMPLATE, [AgGroupComponent, AgSlider, AgCheckbox], {
            navigatorGroup: navigatorGroupParams,
            navigatorHeightSlider: navigatorHeightSliderParams,
            navigatorMiniChartCheckbox: navigatorMiniChartCheckboxParams,
        });
    }
}
