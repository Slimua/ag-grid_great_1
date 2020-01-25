import {
    _,
    Autowired,
    ColumnController,
    Component,
    Events,
    EventService,
    GridOptionsWrapper,
    PostConstruct,
    PreConstruct,
    RefSelector,
    ToolPanelColumnCompParams,
    Constants
} from "@ag-grid-community/core";


export enum EXPAND_STATE { EXPANDED, COLLAPSED, INDETERMINATE }
export enum SELECTED_STATE { CHECKED, UNCHECKED, INDETERMINATE }

export class PrimaryColsHeaderPanel extends Component {
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('eventService') private eventService: EventService;

    @RefSelector('eExpand') private eExpand: HTMLElement;
    @RefSelector('eSelect') private eSelect: HTMLElement;
    @RefSelector('eFilterWrapper') private eFilterWrapper: HTMLElement;
    @RefSelector('eFilterTextField') private eFilterTextField: HTMLInputElement;

    private eExpandChecked: HTMLElement;
    private eExpandUnchecked: HTMLElement;
    private eExpandIndeterminate: HTMLElement;

    private eSelectCheckbox: HTMLInputElement;

    private expandState: EXPAND_STATE;
    private selectState: SELECTED_STATE;

    private onFilterTextChangedDebounced: () => void;

    private params: ToolPanelColumnCompParams;

    @PreConstruct
    private preConstruct(): void {
        const translate = this.gridOptionsWrapper.getLocaleTextFunc();

        this.setTemplate(
            `<div class="ag-column-select-header" role="presentation">
                <div ref="eExpand" class="ag-column-select-header-icon"></div>
                <div ref="eSelect" class="ag-column-select-header-icon"></div>
                <div class="ag-input-wrapper ag-column-select-header-filter-wrapper" ref="eFilterWrapper" role="presentation">
                    <input class="ag-column-select-header-filter" ref="eFilterTextField" type="text" placeholder="${translate(
                    "SearchOoo",
                    "Search..."
                    )}">
                </div>
            </div>`
        );
    }

    @PostConstruct
    public postConstruct(): void {
        this.createExpandIcons();
        this.eSelectCheckbox = document.createElement("input");
        this.eSelectCheckbox.type = "checkbox";
        this.eSelectCheckbox.className = "ag-checkbox";
        this.eSelect.appendChild(this.eSelectCheckbox);

        this.addDestroyableEventListener(
            this.eExpand,
            "click",
            this.onExpandClicked.bind(this)
        );
        this.addDestroyableEventListener(
            this.eSelect,
            "click",
            this.onSelectClicked.bind(this)
        );
        this.addDestroyableEventListener(
            this.eFilterTextField,
            "input",
            this.onFilterTextChanged.bind(this)
        );
        this.addDestroyableEventListener(
            this.eFilterTextField,
            "keypress",
            this.onMiniFilterKeyPress.bind(this)
        );

        this.addDestroyableEventListener(
            this.eventService,
            Events.EVENT_NEW_COLUMNS_LOADED,
            this.showOrHideOptions.bind(this)
        );
    }

    public init(params: ToolPanelColumnCompParams): void {
        this.params = params;

        if (this.columnController.isReady()) {
            this.showOrHideOptions();
        }
    }

    private createExpandIcons() {
        this.eExpand.appendChild((
            this.eExpandChecked = _.createIconNoSpan(
                "columnSelectOpen",
                this.gridOptionsWrapper
            )
        ));

        this.eExpand.appendChild((
            this.eExpandUnchecked = _.createIconNoSpan(
            "columnSelectClosed",
            this.gridOptionsWrapper
            )
        ));

        this.eExpand.appendChild((
            this.eExpandIndeterminate = _.createIconNoSpan(
            "columnSelectIndeterminate",
            this.gridOptionsWrapper
            )
        ));
        this.setExpandState(EXPAND_STATE.EXPANDED);
    }
 
    // we only show expand / collapse if we are showing columns
    private showOrHideOptions(): void {
        const showFilter = !this.params.suppressColumnFilter;
        const showSelect = !this.params.suppressColumnSelectAll;
        const showExpand = !this.params.suppressColumnExpandAll;

        const groupsPresent = this.columnController.isPrimaryColumnGroupsPresent();

        _.setDisplayed(this.eFilterWrapper, showFilter);
        _.setDisplayed(this.eSelect, showSelect);
        _.setDisplayed(this.eExpand, showExpand && groupsPresent);
    }

    private onFilterTextChanged(): void {
        if (!this.onFilterTextChangedDebounced) {
            this.onFilterTextChangedDebounced = _.debounce(() => {
                const filterText = this.eFilterTextField.value;
                this.dispatchEvent({ type: "filterChanged", filterText: filterText });
            }, 300);
        }

        this.onFilterTextChangedDebounced();
    }

    private onMiniFilterKeyPress(e: KeyboardEvent): void {
        if (_.isKeyPressed(e, Constants.KEY_ENTER)) {
            this.onSelectClicked();
        }
    }

    private onSelectClicked(): void {
        const eventType = this.selectState === SELECTED_STATE.CHECKED ? "unselectAll" : "selectAll";
        this.dispatchEvent({ type: eventType });
    }

    private onExpandClicked(): void {
        const eventType = this.expandState === EXPAND_STATE.EXPANDED ? "collapseAll" : "expandAll";
        this.dispatchEvent({ type: eventType });
    }

    public setExpandState(state: EXPAND_STATE): void {
        this.expandState = state;

        _.setDisplayed(
            this.eExpandChecked,
            this.expandState === EXPAND_STATE.EXPANDED
        );
        _.setDisplayed(
            this.eExpandUnchecked,
            this.expandState === EXPAND_STATE.COLLAPSED
        );
        _.setDisplayed(
            this.eExpandIndeterminate,
            this.expandState === EXPAND_STATE.INDETERMINATE
        );
    }

    public setSelectionState(state: SELECTED_STATE): void {
        this.selectState = state;
        this.eSelectCheckbox.checked = this.selectState === SELECTED_STATE.CHECKED;
        this.eSelectCheckbox.indeterminate = this.selectState === SELECTED_STATE.INDETERMINATE;
    }
}
