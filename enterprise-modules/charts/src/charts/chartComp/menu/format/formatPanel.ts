import type { ChartFormatPanel, ChartFormatPanelGroup } from '@ag-grid-community/core';
import { Component, PostConstruct, _warnOnce } from '@ag-grid-community/core';
import type { AgGroupComponent } from '@ag-grid-enterprise/core';

import type { ChartSeriesType } from '../../utils/seriesTypeMapper';
import { isCartesian, isPolar } from '../../utils/seriesTypeMapper';
import type { ChartMenuContext } from '../chartMenuContext';
import { ChartPanelFeature } from '../chartPanelFeature';
import { CartesianAxisPanel } from './axis/cartesianAxisPanel';
import { PolarAxisPanel } from './axis/polarAxisPanel';
import { ChartPanel } from './chart/chartPanel';
import { GroupExpansionFeature } from './groupExpansionFeature';
import { LegendPanel } from './legend/legendPanel';
import { SeriesPanel } from './series/seriesPanel';
import { TitlesPanel } from './titles/titlesPanel';

export interface FormatPanelOptions extends ChartMenuContext {
    isExpandedOnInit: boolean;
    seriesType: ChartSeriesType;
    registerGroupComponent: (groupComponent: AgGroupComponent) => void;
}

const DefaultFormatPanelDef: ChartFormatPanel = {
    groups: [{ type: 'chart' }, { type: 'titles' }, { type: 'legend' }, { type: 'series' }, { type: 'axis' }],
};

export class FormatPanel extends Component {
    public static TEMPLATE = /* html */ `<div class="ag-chart-format-wrapper"></div>`;

    private chartPanelFeature: ChartPanelFeature;
    private groupExpansionFeature: GroupExpansionFeature;

    constructor(private readonly chartMenuContext: ChartMenuContext) {
        super(FormatPanel.TEMPLATE);
    }

    @PostConstruct
    private init() {
        this.groupExpansionFeature = this.createManagedBean(new GroupExpansionFeature(this.getGui()));
        this.chartPanelFeature = this.createManagedBean(
            new ChartPanelFeature(
                this.chartMenuContext.chartController,
                this.getGui(),
                'ag-chart-format-section',
                (_chartType, seriesType) => this.createPanels(seriesType)
            )
        );
        this.chartPanelFeature.refreshPanels();
    }

    private createPanels(seriesType: ChartSeriesType) {
        let panelExpandedOnInit = false;
        this.getFormatPanelDef().groups?.forEach(({ type: group, isOpen: isExpandedOnInit = false }) => {
            // ensure the group should be displayed for the current series type
            if (!this.isGroupPanelShownInSeries(group, seriesType)) {
                return;
            }

            if (isExpandedOnInit) {
                if (panelExpandedOnInit) {
                    _warnOnce(
                        `As of v32, only one charts customize panel group can be expanded at a time. '${group}' will not be expanded.`
                    );
                }
                panelExpandedOnInit = true;
            }

            const registerGroupComponent = (groupComponent: AgGroupComponent) =>
                this.groupExpansionFeature.addGroupComponent(groupComponent);

            const opts: FormatPanelOptions = {
                ...this.chartMenuContext,
                isExpandedOnInit,
                seriesType,
                registerGroupComponent,
            };

            switch (group) {
                case 'chart':
                    this.chartPanelFeature.addComponent(new ChartPanel(opts));
                    break;
                case 'titles':
                    this.chartPanelFeature.addComponent(new TitlesPanel(opts));
                    break;
                case 'legend':
                    this.chartPanelFeature.addComponent(new LegendPanel(opts));
                    break;
                case 'axis':
                    // Polar charts have different axis options from cartesian charts, so choose the appropriate panels
                    if (isPolar(seriesType)) {
                        this.chartPanelFeature.addComponent(new PolarAxisPanel(opts));
                    } else if (isCartesian(seriesType)) {
                        this.chartPanelFeature.addComponent(new CartesianAxisPanel('xAxis', opts));
                        this.chartPanelFeature.addComponent(new CartesianAxisPanel('yAxis', opts));
                    }
                    break;
                case 'horizontalAxis':
                    this.chartPanelFeature.addComponent(new CartesianAxisPanel('xAxis', opts));
                    break;
                case 'verticalAxis':
                    this.chartPanelFeature.addComponent(new CartesianAxisPanel('yAxis', opts));
                    break;
                case 'series':
                    this.chartPanelFeature.addComponent(new SeriesPanel(opts));
                    break;
                case 'navigator':
                    _warnOnce(
                        `'navigator' is now displayed in the charts advanced settings instead of the format panel, and this setting will be ignored.`
                    );
                default:
                    _warnOnce(`Invalid charts format panel group name supplied: '${group}'`);
            }
        });
    }

    private getFormatPanelDef() {
        const userProvidedFormatPanelDef = this.gos.get('chartToolPanelsDef')?.formatPanel;
        return userProvidedFormatPanelDef ? userProvidedFormatPanelDef : DefaultFormatPanelDef;
    }

    private isGroupPanelShownInSeries(group: ChartFormatPanelGroup, seriesType: ChartSeriesType): boolean {
        return (
            ['chart', 'titles', 'legend', 'series'].includes(group) ||
            (isCartesian(seriesType) && ['axis', 'horizontalAxis', 'verticalAxis'].includes(group)) ||
            (isPolar(seriesType) && group === 'axis')
        );
    }
}
