import {
    _,
    AgGroupComponent,
    AgGroupComponentParams,
    AgSlider,
    AgToggleButton,
    Autowired,
    Component,
    PostConstruct,
    RefSelector
} from "@ag-grid-community/core";
import { ChartController } from "../../../chartController";
import { MarkersPanel } from "./markersPanel";
import { ChartTranslator } from "../../../chartTranslator";
import { ShadowPanel } from "./shadowPanel";
import { AreaChartProxy } from "../../../chartProxies/cartesian/areaChartProxy";
import { initFillOpacitySlider, initFontPanelParams, initLineOpacitySlider } from "../widgetInitialiser";
import { FontPanel, FontPanelParams } from "../fontPanel";

export class AreaSeriesPanel extends Component {

    public static TEMPLATE = /* html */
        `<div>
            <ag-group-component ref="seriesGroup">
                <ag-toggle-button ref="seriesTooltipsToggle"></ag-toggle-button>
                <ag-slider ref="seriesLineWidthSlider"></ag-slider>
                <ag-slider ref="seriesLineDashSlider"></ag-slider>
                <ag-slider ref="seriesLineOpacitySlider"></ag-slider>
                <ag-slider ref="seriesFillOpacitySlider"></ag-slider>
            </ag-group-component>
        </div>`;

    @RefSelector('seriesGroup') private seriesGroup: AgGroupComponent;
    @RefSelector('seriesTooltipsToggle') private seriesTooltipsToggle: AgToggleButton;
    @RefSelector('seriesLineWidthSlider') private seriesLineWidthSlider: AgSlider;
    @RefSelector('seriesLineDashSlider') private seriesLineDashSlider: AgSlider;
    @RefSelector('seriesLineOpacitySlider') private seriesLineOpacitySlider: AgSlider;
    @RefSelector('seriesFillOpacitySlider') private seriesFillOpacitySlider: AgSlider;

    @Autowired('chartTranslator') private chartTranslator: ChartTranslator;

    private readonly chartController: ChartController;
    private activePanels: Component[] = [];

    constructor(chartController: ChartController) {
        super();
        this.chartController = chartController;
    }

    @PostConstruct
    private init() {
        const groupParams: AgGroupComponentParams = {
            cssIdentifier: 'charts-format-top-level',
            direction: 'vertical'
        };
        this.setTemplate(AreaSeriesPanel.TEMPLATE, {seriesGroup: groupParams});

        this.initSeriesGroup();
        this.initSeriesTooltips();
        this.initSeriesLineWidth();
        this.initSeriesLineDash();
        this.initOpacity();
        this.initMarkersPanel();
        this.initLabelPanel();
        this.initShadowPanel();
    }

    private initSeriesGroup() {
        this.seriesGroup
            .setTitle(this.chartTranslator.translate("series"))
            .toggleGroupExpand(false)
            .hideEnabledCheckbox(true);
    }

    private initSeriesTooltips() {
        this.seriesTooltipsToggle
            .setLabel(this.chartTranslator.translate("tooltips"))
            .setLabelAlignment("left")
            .setLabelWidth("flex")
            .setInputWidth(45)
            .setValue(this.getChartProxy().getSeriesOption("tooltip.enabled") || false)
            .onValueChange(newValue => this.getChartProxy().setSeriesOption("tooltip.enabled", newValue));
    }

    private initSeriesLineWidth() {
        this.seriesLineWidthSlider
            .setLabel(this.chartTranslator.translate("lineWidth"))
            .setMaxValue(10)
            .setTextFieldWidth(45)
            .setValue(this.getChartProxy().getSeriesOption("stroke.width"))
            .onValueChange(newValue => this.getChartProxy().setSeriesOption("stroke.width", newValue));
    }

    private initSeriesLineDash() {
        this.seriesLineDashSlider
            .setLabel(this.chartTranslator.translate('lineDash'))
            .setMaxValue(30)
            .setTextFieldWidth(45)
            .setValue(this.getChartProxy().getSeriesOption("lineDash"))
            .onValueChange(newValue => this.getChartProxy().setSeriesOption("lineDash", [newValue]));
    }

    private initOpacity() {
        initLineOpacitySlider(this.seriesLineOpacitySlider, this.chartTranslator, this.getChartProxy());
        initFillOpacitySlider(this.seriesFillOpacitySlider, this.chartTranslator, this.getChartProxy());
    }

    private initLabelPanel() {
        const params: FontPanelParams = initFontPanelParams(this.chartTranslator, this.getChartProxy());
        const labelPanelComp = this.createBean(new FontPanel(params));
        this.activePanels.push(labelPanelComp);
        this.seriesGroup.addItem(labelPanelComp);
    }

    private initMarkersPanel() {
        const markersPanelComp = this.createBean(new MarkersPanel(this.chartController));
        this.seriesGroup.addItem(markersPanelComp);
        this.activePanels.push(markersPanelComp);
    }

    private initShadowPanel() {
        const shadowPanelComp = this.createBean(new ShadowPanel(this.chartController));
        this.seriesGroup.addItem(shadowPanelComp);
        this.activePanels.push(shadowPanelComp);
    }

    private destroyActivePanels(): void {
        this.activePanels.forEach(panel => {
            _.removeFromParent(panel.getGui());
            this.destroyBean(panel);
        });
    }

    private getChartProxy(): AreaChartProxy {
        return this.chartController.getChartProxy() as AreaChartProxy;
    }

    protected destroy(): void {
        this.destroyActivePanels();
        super.destroy();
    }
}
