import {
    _,
    AgGroupComponent,
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

export class AreaSeriesPanel extends Component {

    public static TEMPLATE =
        `<div>
            <ag-group-component ref="seriesGroup">
                <ag-toggle-button ref="seriesTooltipsToggle"></ag-toggle-button>
                <ag-slider ref="seriesLineWidthSlider"></ag-slider>
                <ag-slider ref="seriesLineOpacitySlider"></ag-slider>
                <ag-slider ref="seriesFillOpacitySlider"></ag-slider>
            </ag-group-component>
        </div>`;

    @RefSelector('seriesGroup') private seriesGroup: AgGroupComponent;
    @RefSelector('seriesTooltipsToggle') private seriesTooltipsToggle: AgToggleButton;
    @RefSelector('seriesLineWidthSlider') private seriesLineWidthSlider: AgSlider;
    @RefSelector('seriesLineOpacitySlider') private seriesLineOpacitySlider: AgSlider;
    @RefSelector('seriesFillOpacitySlider') private seriesFillOpacitySlider: AgSlider;

    @Autowired('chartTranslator') private chartTranslator: ChartTranslator;

    private readonly chartController: ChartController;
    private readonly chartProxy: AreaChartProxy;
    private activePanels: Component[] = [];

    constructor(chartController: ChartController) {
        super();
        this.chartController = chartController;
        this.chartProxy = chartController.getChartProxy() as AreaChartProxy;
    }

    @PostConstruct
    private init() {
        this.setTemplate(AreaSeriesPanel.TEMPLATE);

        this.initSeriesGroup();
        this.initSeriesTooltips();
        this.initSeriesLineWidth();
        this.initOpacity();
        this.initMarkersPanel();
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
            .setInputWidth(40)
            .setValue(this.chartProxy.getSeriesOption("tooltip.enabled") || false)
            .onValueChange(newValue => this.chartProxy.setSeriesOption("tooltip.enabled", newValue));
    }

    private initSeriesLineWidth() {
        this.seriesLineWidthSlider
            .setLabel(this.chartTranslator.translate("lineWidth"))
            .setMaxValue(10)
            .setTextFieldWidth(45)
            .setValue(this.chartProxy.getSeriesOption("stroke.width"))
            .onValueChange(newValue => this.chartProxy.setSeriesOption("stroke.width", newValue));
    }

    private initOpacity() {
        this.seriesLineOpacitySlider
            .setLabel(this.chartTranslator.translate("strokeOpacity"))
            .setStep(0.05)
            .setMaxValue(1)
            .setTextFieldWidth(45)
            .setValue(this.chartProxy.getSeriesOption("stroke.opacity") || "1")
            .onValueChange(newValue => this.chartProxy.setSeriesOption("stroke.opacity", newValue));

        this.seriesFillOpacitySlider
            .setLabel(this.chartTranslator.translate("fillOpacity"))
            .setStep(0.05)
            .setMaxValue(1)
            .setTextFieldWidth(45)
            .setValue(this.chartProxy.getSeriesOption("fill.opacity") || "1")
            .onValueChange(newValue => this.chartProxy.setSeriesOption("fill.opacity", newValue));
    }

    private initMarkersPanel() {
        const markersPanelComp = this.wireBean(new MarkersPanel(this.chartController));
        this.seriesGroup.addItem(markersPanelComp);
        this.activePanels.push(markersPanelComp);
    }

    private initShadowPanel() {
        const shadowPanelComp = this.wireBean(new ShadowPanel(this.chartProxy));
        this.seriesGroup.addItem(shadowPanelComp);
        this.activePanels.push(shadowPanelComp);
    }

    private destroyActivePanels(): void {
        this.activePanels.forEach(panel => {
            _.removeFromParent(panel.getGui());
            panel.destroy();
        });
    }

    public destroy(): void {
        this.destroyActivePanels();
        super.destroy();
    }
}
