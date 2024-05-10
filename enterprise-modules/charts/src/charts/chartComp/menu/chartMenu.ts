import {
    AgPanel,
    AgPromise,
    Autowired,
    ChartCreated,
    ChartToolbarMenuItemOptions,
    ChartToolPanelMenuOptions,
    Component,
    Events,
    PostConstruct
} from "@ag-grid-community/core";

import { TabbedChartMenu } from "./tabbedChartMenu";
import { ChartController } from "../chartController";
import { ExtraPaddingDirection } from "../chartProxies/chartProxy";
import { ChartMenuListFactory } from "./chartMenuList";
import { ChartToolbar } from "./chartToolbar";
import { ChartMenuService } from "../services/chartMenuService";
import { ChartMenuContext } from "./chartMenuContext";

type ChartToolbarButtons = {
    [key in ChartToolbarMenuItemOptions]: {
        iconName: string, callback: (eventSource: HTMLElement) => void
    }
};

export class ChartMenu extends Component {
    @Autowired('chartMenuService') private chartMenuService: ChartMenuService;
    @Autowired('chartMenuListFactory') private chartMenuListFactory: ChartMenuListFactory;

    private readonly chartController: ChartController;

    private buttons: ChartToolbarButtons = {
        chartLink: { iconName: 'linked', callback: () => this.chartMenuService.toggleLinked(this.chartMenuContext) },
        chartUnlink: { iconName: 'unlinked', callback: () => this.chartMenuService.toggleLinked(this.chartMenuContext) },
        chartDownload: { iconName: 'save', callback: () => this.chartMenuService.downloadChart(this.chartMenuContext) },
        chartMenu: { iconName: 'menuAlt', callback: (eventSource: HTMLElement) => this.showMenuList(eventSource) }
    };

    private panels: ChartToolPanelMenuOptions[] = [];
    private defaultPanel: ChartToolPanelMenuOptions;

    private static TEMPLATE = /* html */ `<div class="ag-chart-menu-wrapper"></div>`;

    private chartToolbar: ChartToolbar;
    private tabbedMenu: TabbedChartMenu;
    private menuPanel?: AgPanel;
    private menuVisible = false;
    private chartToolbarOptions: ChartToolbarMenuItemOptions[];

    constructor(
        private readonly eChartContainer: HTMLElement,
        private readonly eMenuPanelContainer: HTMLElement,
        private readonly chartMenuContext: ChartMenuContext
    ) {
        super(ChartMenu.TEMPLATE);
        this.chartController = chartMenuContext.chartController;
    }

    @PostConstruct
    private postConstruct(): void {
        this.chartToolbar = this.createManagedBean(new ChartToolbar());
        this.getGui().appendChild(this.chartToolbar.getGui());
        
        this.refreshToolbarAndPanels();

        this.addManagedListener(this.eventService, Events.EVENT_CHART_CREATED, (e: ChartCreated) => {
            if (e.chartId === this.chartController.getChartId()) {
                const showDefaultToolPanel = Boolean(this.gos.get('chartToolPanelsDef')?.defaultToolPanel);
                if (showDefaultToolPanel) {
                    this.showMenu({ panel: this.defaultPanel, suppressFocus: true });
                }
            }
        });
        this.addManagedListener(this.chartController, ChartController.EVENT_CHART_LINKED_CHANGED, this.refreshToolbarAndPanels.bind(this));

        this.refreshMenuClasses();

        this.addManagedListener(this.chartController, ChartController.EVENT_CHART_API_UPDATE, this.refreshToolbarAndPanels.bind(this));
    }

    public isVisible(): boolean {
        return this.menuVisible;
    }

    public getExtraPaddingDirections(): ExtraPaddingDirection[]  {
        return ([
            'chartMenu', 'chartLink', 'chartUnlink', 'chartDownload'
        ] as const).some(v => this.chartToolbarOptions.includes(v))
            ? ['top']
            : [];
    }

    private refreshToolbarAndPanels(): void {
        this.initToolbarOptionsAndPanels();
        this.updateToolbar();
    }

    private initToolbarOptionsAndPanels(): void {
        const {
            panels,
            defaultPanel
        } = this.chartMenuService.getChartToolPanels(this.chartController);
        this.panels = panels;
        this.defaultPanel = defaultPanel;
        this.chartToolbarOptions = this.chartMenuService.getChartToolbarOptions();
    }

    private updateToolbar(): void {
        const buttons = this.chartToolbarOptions.map(buttonName => {
            const { iconName, callback } = this.buttons[buttonName];
            return {
                buttonName,
                iconName,
                callback
            };
        });
        this.chartToolbar.updateParams({ buttons });
    }

    private createMenuPanel(defaultTab: number): AgPromise<AgPanel> {
        const width = this.environment.getDefaultChartMenuPanelWidth();

        const menuPanel = this.menuPanel = this.createBean(new AgPanel({
            minWidth: width,
            width,
            height: '100%',
            closable: true,
            hideTitleBar: true,
            cssIdentifier: 'chart-menu'
        }));

        menuPanel.setParentComponent(this);
        this.eMenuPanelContainer.appendChild(menuPanel.getGui());

        this.tabbedMenu = this.createBean(new TabbedChartMenu(
            this.panels,
            this.chartMenuContext
        ));

        this.addManagedListener(this.tabbedMenu, TabbedChartMenu.EVENT_CLOSED, () => {
            this.hideMenu();
        });

        this.addManagedListener(
            menuPanel,
            Component.EVENT_DESTROYED,
            () => this.destroyBean(this.tabbedMenu)
        );

        return new AgPromise((res: (arg0: any) => void) => {
            window.setTimeout(() => {
                menuPanel.setBodyComponent(this.tabbedMenu);
                this.tabbedMenu.showTab(defaultTab);
                res(menuPanel);
            }, 100);
        });
    }

    private showContainer(eventSource?: HTMLElement, suppressFocus?: boolean) {
        if (!this.menuPanel) { return; }

        this.menuVisible = true;
        this.refreshMenuClasses();
        this.tabbedMenu.showMenu(eventSource, suppressFocus);
    }

    public showMenu(params?: {
        /**
         * Menu panel to show. If empty, shows the existing menu, or creates the default menu if menu panel has not been created
         */
        panel?: ChartToolPanelMenuOptions,
        eventSource?: HTMLElement,
        suppressFocus?: boolean
    }): void {
        const { panel, eventSource, suppressFocus } = params ?? {};

        if (this.menuPanel && !panel) {
            this.showContainer(eventSource, suppressFocus);
        } else {
            const menuPanel = panel || this.defaultPanel;
            let tab = this.panels.indexOf(menuPanel);
            if (tab < 0) {
                console.warn(`AG Grid: '${panel}' is not a valid Chart Tool Panel name`);
                tab = this.panels.indexOf(this.defaultPanel)
            }
    
            if (this.menuPanel) {
                this.tabbedMenu.showTab(tab);
                this.showContainer(eventSource, suppressFocus);
            } else {
                this.createMenuPanel(tab).then(() => this.showContainer(eventSource, suppressFocus));
            }
        }
    }

    public hideMenu(): void {
        this.menuVisible = false;
        this.refreshMenuClasses();
    }

    private refreshMenuClasses() {
        this.eChartContainer.classList.toggle('ag-chart-menu-visible', this.menuVisible);
        this.eChartContainer.classList.toggle('ag-chart-menu-hidden', !this.menuVisible);
    }

    private showMenuList(eventSource: HTMLElement): void {
        this.chartMenuListFactory.showMenuList({
            eventSource,
            showMenu: () => this.showMenu({ eventSource }),
            chartMenuContext: this.chartMenuContext
        });
    }

    protected destroy() {
        super.destroy();

        if (this.menuPanel && this.menuPanel.isAlive()) {
            this.destroyBean(this.menuPanel);
        }

        if (this.tabbedMenu && this.tabbedMenu.isAlive()) {
            this.destroyBean(this.tabbedMenu);
        }
    }
}
