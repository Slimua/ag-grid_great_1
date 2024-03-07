import {
    _,
    AgCheckbox,
    AgGroupComponent,
    AgGroupComponentParams,
    AgSelect,
    AgSelectParams,
    AgSlider,
    AgSliderParams,
    Autowired,
    Component,
    PostConstruct,
    RefSelector,
} from "@ag-grid-community/core";
import { ChartController } from "../../../chartController";
import { AxisTicksPanel } from "./axisTicksPanel";
import { FontPanel, FontPanelParams } from "../fontPanel";
import { ChartTranslationKey, ChartTranslationService } from "../../../services/chartTranslationService";
import { FormatPanelOptions } from "../formatPanel";
import { GridLinePanel } from '../gridLine/gridLinePanel';
import { AgAngleSelect } from "../../../../../widgets/agAngleSelect";
import { ChartMenuUtils } from "../../chartMenuUtils";
import { ChartOptionsProxy } from '../../../services/chartOptionsService';
import { isPolar } from '../../../utils/seriesTypeMapper';
import { AgColorPickerParams } from '../../../../../widgets/agColorPicker';

export class CartesianAxisPanel extends Component {

    public static TEMPLATE = /* html */
        `<div>
            <ag-group-component ref="axisGroup">
                <ag-select ref="axisTypeSelect"></ag-select>
                <ag-select ref="axisPositionSelect"></ag-select>
                <ag-color-picker ref="axisColorInput"></ag-color-picker>
                <ag-slider ref="axisLineWidthSlider"></ag-slider>
            </ag-group-component>
        </div>`;

    @RefSelector('axisGroup') private axisGroup: AgGroupComponent;
    @RefSelector('axisTypeSelect') private axisTypeSelect: AgSelect;
    @RefSelector('axisPositionSelect') private axisPositionSelect: AgSelect;

    @Autowired('chartTranslationService') private readonly chartTranslationService: ChartTranslationService;

    private readonly axisType: 'xAxis' | 'yAxis';
    private readonly chartController: ChartController;
    private readonly chartAxisOptionsProxy: ChartOptionsProxy;
    private readonly chartAxisThemeOverridesProxy: ChartOptionsProxy;
    private readonly chartAxisAppliedThemeOverridesProxy: ChartOptionsProxy;
    private readonly isExpandedOnInit: boolean;

    private activePanels: Component[] = [];
    private axisLabelUpdateFuncs: Function[] = [];

    private prevRotation: number | undefined;

    constructor(axisType: 'xAxis' | 'yAxis', { chartController, chartOptionsService, isExpandedOnInit = false }: FormatPanelOptions) {
        super();

        this.axisType = axisType;
        this.chartController = chartController;
        this.chartAxisOptionsProxy = chartOptionsService.getCartesianAxisOptionsProxy(axisType);
        this.chartAxisThemeOverridesProxy = chartOptionsService.getCartesianAxisThemeOverridesProxy(axisType);
        this.chartAxisAppliedThemeOverridesProxy = chartOptionsService.getCartesianAxisAppliedThemeOverridesProxy(axisType);
        this.isExpandedOnInit = isExpandedOnInit;
    }

    @PostConstruct
    private init() {
        const labelKey: ChartTranslationKey = this.axisType;
        const axisGroupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-top-level',
            direction: 'vertical',
            title: this.translate(labelKey),
            expanded: this.isExpandedOnInit,
            suppressEnabledCheckbox: true
        };

        const chartAxisOptions = this.createManagedBean(new ChartMenuUtils(this.chartAxisOptionsProxy));
        const chartAxisThemeOverrides = this.createManagedBean(new ChartMenuUtils(this.chartAxisThemeOverridesProxy));

        const axisTypeSelectParams = this.getAxisTypeSelectParams(chartAxisOptions, this.chartAxisAppliedThemeOverridesProxy);
        const axisPositionSelectParams = this.getAxisPositionSelectParams(chartAxisOptions);
        const axisColorInputParams = this.getAxisColorInputParams(chartAxisThemeOverrides);
        const axisLineWidthSliderParams = this.getAxisLineWidthSliderParams(chartAxisThemeOverrides);

        this.setTemplate(CartesianAxisPanel.TEMPLATE, {
            axisGroup: axisGroupParams,
            axisTypeSelect: axisTypeSelectParams ?? undefined,
            axisPositionSelect: axisPositionSelectParams ?? undefined,
            axisColorInput: axisColorInputParams,
            axisLineWidthSlider: axisLineWidthSliderParams
        });

        if (!axisTypeSelectParams) this.removeTemplateComponent(this.axisTypeSelect);
        if (!axisPositionSelectParams) this.removeTemplateComponent(this.axisPositionSelect);

        this.initGridLines(chartAxisThemeOverrides);
        this.initAxisTicks(chartAxisThemeOverrides);
        this.initAxisLabels(chartAxisThemeOverrides);

        const updateAxisLabelRotations = () => this.axisLabelUpdateFuncs.forEach(func => func());
        this.addManagedListener(this.chartController, ChartController.EVENT_CHART_UPDATED, updateAxisLabelRotations);
    }

    private getAxisTypeSelectParams(chartAxisOptions: ChartMenuUtils, chartAxisAppliedThemeOverrides: ChartOptionsProxy): AgSelectParams | null {
        const axisTypeSelectOptions = ((chartType, axisType) => {
            if (isPolar(chartType)) return null;
            switch (axisType) {
                case 'xAxis': return [
                    { value: 'category', text: this.translate('category') },
                    { value: 'number', text: this.translate('number') },
                    { value: 'time', text: this.translate('time') },
                ];
                case 'yAxis': return null;
            }
        })(this.chartController.getChartType(), this.axisType);
        if (!axisTypeSelectOptions) return null;
        const params = chartAxisOptions.getDefaultSelectParams(
            'type',
            'axisType',
            axisTypeSelectOptions,
        );
        params.onValueChange = ((onValueChange) => (value) => {
            const previousAxisType = chartAxisOptions.getChartOptions().getValue('type');
            if (value === previousAxisType) return;
            // If the axis type is changed, we need to carry over all the accumulated theme overrides
            // that have been applied to the existing axis type so far
            const previousAxisThemeOverrides = chartAxisAppliedThemeOverrides.getValue('*');
            // Update the axis type
            onValueChange?.(value);
            // Reapply the previous theme overrides to the new axis type
            chartAxisAppliedThemeOverrides.setValue('*', previousAxisThemeOverrides);
        })(params.onValueChange);
        return params;
    }

    private getAxisPositionSelectParams(chartAxisOptions: ChartMenuUtils): AgSelectParams | null {
        const axisPositionSelectOptions = ((chartType, axisType) => {
            if (isPolar(chartType)) return null;
            switch (axisType) {
                case 'xAxis': return [
                    { value: 'top', text: this.translate('top') },
                    { value: 'bottom', text: this.translate('bottom') },
                ];
                case 'yAxis': return [
                    { value: 'left', text: this.translate('left') },
                    { value: 'right', text: this.translate('right') },
                ];
            }
        })(this.chartController.getChartType(), this.axisType);
        if (!axisPositionSelectOptions) return null;
        return chartAxisOptions.getDefaultSelectParams(
            'position',
            'position',
            axisPositionSelectOptions,
        );
    }

    private getAxisColorInputParams(chartAxisThemeOverrides: ChartMenuUtils): AgColorPickerParams {
        return chartAxisThemeOverrides.getDefaultColorPickerParams('line.color');
    }

    private getAxisLineWidthSliderParams(chartAxisThemeOverrides: ChartMenuUtils): AgSliderParams {
        const chartOptions = chartAxisThemeOverrides.getChartOptions();
        // Note that there is no separate checkbox for enabling/disabling the axis line. Whenever the line width is
        // changed, the value for `line.enabled` is inferred based on the whether the `line.width` value is non-zero.
        const getAxisLineWidth = (): number | null => {
            const isAxisLineEnabled = chartOptions.getValue<boolean>('line.enabled');
            if (!isAxisLineEnabled) return null;
            return chartOptions.getValue<number>('line.width');
        };
        const setAxisLineWidth = (value: number | null): void => {
            chartOptions.setValues<number | boolean>([
                { expression: 'line.enabled', value: value != null },
                { expression: 'line.width', value: value ?? 0},
            ]);
        };
        const axisLineWidthSliderParams = chartAxisThemeOverrides.getDefaultSliderParamsWithoutValueParams(
            getAxisLineWidth() ?? 0,
            "thickness",
            10
        );
        axisLineWidthSliderParams.onValueChange = (newValue) => {
            setAxisLineWidth(newValue === 0 ? null : newValue);
        };
        return axisLineWidthSliderParams;
    }

    private initGridLines(chartAxisThemeOverrides: ChartMenuUtils) {
        const gridLineComp = this.createBean(new GridLinePanel(chartAxisThemeOverrides));
        this.axisGroup.addItem(gridLineComp);
        this.activePanels.push(gridLineComp);
    }

    private initAxisTicks(chartAxisThemeOverrides: ChartMenuUtils) {
        if (!this.hasConfigurableAxisTicks()) return;
        const axisTicksComp = this.createBean(new AxisTicksPanel(chartAxisThemeOverrides));
        this.axisGroup.addItem(axisTicksComp);
        this.activePanels.push(axisTicksComp);
    }

    private hasConfigurableAxisTicks(): boolean {
        // Axis ticks are disabled for some chart types
        const chartType = this.chartController.getChartType();
        switch (chartType) {
            case 'radarLine':
            case 'radarArea':
            case 'rangeBar':
            case 'boxPlot':
            case 'waterfall':
                return false;
            default:
                return true;
        }
    }

    private initAxisLabels(chartAxisThemeOverrides: ChartMenuUtils) {
        const params: FontPanelParams = {
            name: this.translate("labels"),
            enabled: true,
            suppressEnabledCheckbox: true,
            chartMenuUtils: chartAxisThemeOverrides,
            keyMapper: key => `label.${key}`
        };

        const labelPanelComp = this.createBean(new FontPanel(params));
        this.axisGroup.addItem(labelPanelComp);
        this.activePanels.push(labelPanelComp);

        this.addAdditionalLabelComps(labelPanelComp, chartAxisThemeOverrides);
    }

    private addAdditionalLabelComps(labelPanelComp: FontPanel, chartAxisThemeOverrides: ChartMenuUtils) {
        this.addLabelPadding(labelPanelComp, chartAxisThemeOverrides);

        const rotationComp = this.createRotationWidget('labelRotation', chartAxisThemeOverrides);
        const autoRotateCb = this.initLabelRotation(rotationComp, chartAxisThemeOverrides);

        labelPanelComp.addCompToPanel(autoRotateCb);
        labelPanelComp.addCompToPanel(rotationComp);
    }

    private initLabelRotation(rotationComp: AgAngleSelect, chartAxisThemeOverrides: ChartMenuUtils) {
        const chartOptions = chartAxisThemeOverrides.getChartOptions();

        const getLabelRotationValue = (): number | undefined => {
            return chartOptions.getValue<number | undefined>('label.rotation');
        };
        const getLabelAutoRotateValue = (): boolean => {
            return chartOptions.getValue<boolean>('label.autoRotate');
        };

        const updateAutoRotate = (autoRotate: boolean) => {
            // Remember the existing rotation before we clear it from the options
            if (autoRotate) this.prevRotation = getLabelRotationValue();

            // For the autoRotate option to take effect, we need to additionally clear the rotation option value
            chartOptions.setValues<boolean | number | undefined>([
                { expression: "label.autoRotate", value: autoRotate },
                // Clear the rotation option when activating auto-rotate, reinstate the previous value when deactivating
                { expression: "label.rotation", value: autoRotate ? undefined : this.prevRotation }
            ]);

            rotationComp.setDisabled(autoRotate);
        };

        const rotation = getLabelRotationValue();
        const autoRotate = typeof rotation === 'number' ? false : getLabelAutoRotateValue();

        const autoRotateCheckbox = this.createBean(new AgCheckbox({
            label: this.translate('autoRotate'),
            value: autoRotate,
            onValueChange: updateAutoRotate
        }));

        // init rotation comp state
        rotationComp.setDisabled(autoRotate);

        return autoRotateCheckbox;
    }

    private createRotationWidget(labelKey: ChartTranslationKey, chartAxisThemeOverrides: ChartMenuUtils) {
        const chartOptions = chartAxisThemeOverrides.getChartOptions();

        const getLabelRotationValue = (): number | undefined => {
            return chartOptions.getValue<number | undefined>('label.rotation');
        };
        const setLabelRotationValue = (value: number | undefined): void => {
            return chartOptions.setValue<number | undefined>('label.rotation', value);
        };

        const degreesSymbol = String.fromCharCode(176);

        const label = `${this.chartTranslationService.translate(labelKey)} ${degreesSymbol}`;
        const angleSelect = new AgAngleSelect({
            label,
            labelWidth: "flex",
            value: getLabelRotationValue() ?? 0,
            onValueChange: setLabelRotationValue,
        });

        // the axis label rotation needs to be updated when the default category changes in the data panel
        this.axisLabelUpdateFuncs.push(() => {
            angleSelect.setValue(getLabelRotationValue() ?? 0);
        });

        return this.createBean(angleSelect);
    }

    private addLabelPadding(labelPanelComp: FontPanel, chartAxisThemeOverrides: ChartMenuUtils) {
        const labelPaddingSlider = this.createBean(new AgSlider(chartAxisThemeOverrides.getDefaultSliderParams(
            "label.padding",
            "padding",
            30
        )));

        labelPanelComp.addCompToPanel(labelPaddingSlider);
    }

    private translate(key: ChartTranslationKey) {
        return this.chartTranslationService.translate(key);
    }

    private removeTemplateComponent(component: Component): void {
        _.removeFromParent(component.getGui());
        this.destroyBean(component);
    }

    private destroyActivePanels(): void {
        this.activePanels.forEach(panel => {
            _.removeFromParent(panel.getGui());
            this.destroyBean(panel);
        });
    }

    protected destroy(): void {
        this.destroyActivePanels();
        super.destroy();
    }
}
