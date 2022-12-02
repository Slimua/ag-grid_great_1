import {
    _,
    AgCheckbox,
    AgEvent,
    Autowired,
    ColDef,
    Column,
    Component,
    ISetFilterCellRendererParams,
    ISetFilterParams,
    ITooltipParams,
    PostConstruct,
    RefSelector,
    UserComponentFactory,
    ValueFormatterService,
    WithoutGridCommon,
    ValueFormatterParams
} from '@ag-grid-community/core';
import { ISetFilterLocaleText } from './localeText';

export interface SetFilterListItemSelectionChangedEvent extends AgEvent {
    isSelected: boolean;
}

export interface SetFilterListItemExpandedChangedEvent extends AgEvent {
    isExpanded: boolean;
}

export interface SetFilterListItemParams<V> {
    focusWrapper: HTMLElement,
    value: V | null | (() => string),
    params: ISetFilterParams<any, V>,
    translate: (key: keyof ISetFilterLocaleText) => string,
    valueFormatter: (params: ValueFormatterParams) => string,
    isSelected: boolean | undefined,
    isTree?: boolean,
    depth?: number,
    groupsExist?: boolean,
    isGroup?: boolean,
    isExpanded?: boolean
}

/** @param V type of value in the Set Filter */
export class SetFilterListItem<V> extends Component {
    public static EVENT_SELECTION_CHANGED = 'selectionChanged';
    public static EVENT_EXPANDED_CHANGED = 'expandedChanged';

    @Autowired('valueFormatterService') private readonly valueFormatterService: ValueFormatterService;
    @Autowired('userComponentFactory') private readonly userComponentFactory: UserComponentFactory;

    private static GROUP_TEMPLATE = /* html */`
        <div class="ag-set-filter-item" aria-hidden="true">
            <span class="ag-set-filter-group-icons">
                <span class="ag-set-filter-group-closed-icon" ref="eGroupClosedIcon"></span>
                <span class="ag-set-filter-group-opened-icon" ref="eGroupOpenedIcon"></span>
            </span>
            <ag-checkbox ref="eCheckbox" class="ag-set-filter-item-checkbox"></ag-checkbox>
        </div>`;

    private static TEMPLATE = /* html */`
        <div class="ag-set-filter-item">
            <ag-checkbox ref="eCheckbox" class="ag-set-filter-item-checkbox"></ag-checkbox>
        </div>`;

    @RefSelector('eCheckbox') private readonly eCheckbox: AgCheckbox;

    @RefSelector('eGroupOpenedIcon') private eGroupOpenedIcon: HTMLElement;
    @RefSelector('eGroupClosedIcon') private eGroupClosedIcon: HTMLElement;

    private readonly focusWrapper: HTMLElement;
    private readonly value: V | null | (() => string);
    private readonly params: ISetFilterParams<any, V>;
    private readonly translate: (key: keyof ISetFilterLocaleText) => string;
    private readonly valueFormatter: (params: ValueFormatterParams) => string;
    private readonly isTree?: boolean;
    private readonly depth: number;
    private readonly isGroup?: boolean;
    private readonly groupsExist?: boolean

    private isSelected: boolean | undefined;
    private isExpanded?: boolean;

    constructor(params: SetFilterListItemParams<V>) {
        super(params.isGroup ? SetFilterListItem.GROUP_TEMPLATE : SetFilterListItem.TEMPLATE);
        this.focusWrapper = params.focusWrapper;
        this.value = params.value;
        this.params = params.params;
        this.translate = params.translate;
        this.valueFormatter = params.valueFormatter;
        this.isSelected = params.isSelected;
        this.isTree = params.isTree;
        this.depth = params.depth ?? 0;
        this.isGroup = params.isGroup;
        this.groupsExist = params.groupsExist;
        this.isExpanded = params.isExpanded;
    }

    @PostConstruct
    private init(): void {
        this.render();

        this.eCheckbox.setValue(this.isSelected, true);
        this.eCheckbox.setDisabled(!!this.params.readOnly);

        this.refreshVariableAriaLabels();

        if (this.isTree) {
            if (this.depth > 0) {
                this.addCssClass('ag-set-filter-indent-' + this.depth);
            }
            if (this.isGroup) {
                this.setupExpansion();
            } else {
                if (this.groupsExist) {
                    this.addCssClass('ag-set-filter-add-group-indent');
                }
            }

            _.setAriaLevel(this.focusWrapper, this.depth + 1)
        }

        if (!!this.params.readOnly) {
            // Don't add event listeners if we're read-only.
            return;
        }

        this.eCheckbox.onValueChange((value) => this.onCheckboxChanged(!!value));
    }

    private setupExpansion(): void {
        this.eGroupClosedIcon.appendChild(_.createIcon('setFilterGroupClosed', this.gridOptionsService, null));
        this.eGroupOpenedIcon.appendChild(_.createIcon('setFilterGroupOpen', this.gridOptionsService, null));

        this.setOpenClosedIcons();
        this.refreshAriaExpanded();

        this.addManagedListener(this.eGroupClosedIcon, 'click', this.onExpandOrContractClicked.bind(this));
        this.addManagedListener(this.eGroupOpenedIcon, 'click', this.onExpandOrContractClicked.bind(this));
    }

    private onExpandOrContractClicked(): void {
        this.setExpanded(!this.isExpanded);
    }

    public setExpanded(isExpanded: boolean): void {
        if (this.isGroup && isExpanded !== this.isExpanded) {
            this.isExpanded = isExpanded;

            const event: SetFilterListItemExpandedChangedEvent = {
                type: SetFilterListItem.EVENT_EXPANDED_CHANGED,
                isExpanded,
            };

            this.dispatchEvent(event);

            this.setOpenClosedIcons();
            this.refreshAriaExpanded();
        }
    }

    private refreshAriaExpanded(): void {
        _.setAriaExpanded(this.focusWrapper, !!this.isExpanded);
    }

    private setOpenClosedIcons(): void {
        const folderOpen = !!this.isExpanded;
        _.setDisplayed(this.eGroupClosedIcon, !folderOpen);
        _.setDisplayed(this.eGroupOpenedIcon, folderOpen);
    }

    private onCheckboxChanged(isSelected: boolean): void {
        this.isSelected = isSelected;

        const event: SetFilterListItemSelectionChangedEvent = {
            type: SetFilterListItem.EVENT_SELECTION_CHANGED,
            isSelected,
        };

        this.dispatchEvent(event);

        this.refreshVariableAriaLabels();
    }

    public toggleSelected(): void {
        if (!!this.params.readOnly) { return; }

        this.isSelected = !this.isSelected;
        this.eCheckbox.setValue(this.isSelected);
    }

    private refreshVariableAriaLabels(): void {
        if (!this.isTree) { return; }
        const translate = this.localeService.getLocaleTextFunc();
        const checkboxValue = this.eCheckbox.getValue();
        const state = checkboxValue === undefined ?
            translate('ariaIndeterminate', 'indeterminate') : 
            (checkboxValue ? translate('ariaVisible', 'visible') : translate('ariaHidden', 'hidden'));
        const visibilityLabel = translate('ariaToggleVisibility', 'Press SPACE to toggle visibility');
        this.eCheckbox.setInputAriaLabel(`${visibilityLabel} (${state})`);
    }
    
    private setupFixedAriaLabels(value: any): void {
        if (!this.isTree) { return; }
        const translate = this.localeService.getLocaleTextFunc();
        const itemLabel = translate('ariaFilterValue', 'Filter Value');
        _.setAriaLabel(this.focusWrapper, `${value} ${itemLabel}`);
        _.setAriaDescribedBy(this.focusWrapper, this.eCheckbox.getInputElement().id);
    }

    public render(): void {
        const { params: { column } } = this;

        let { value } = this;
        let formattedValue: string | null = null;

        if (typeof value === 'function') {
            formattedValue = (value as () => string)();
            // backwards compatibility for select all in value
            value = formattedValue as any;
        } else {
            formattedValue = this.getFormattedValue(column, value);
        }

        if (this.params.showTooltips) {
            const tooltipValue = formattedValue != null ? formattedValue : String(value);
            this.setTooltip(tooltipValue);
        }

        const params: ISetFilterCellRendererParams = {
            value,
            valueFormatted: formattedValue,
            api: this.gridOptionsService.get('api')!,
            columnApi: this.gridOptionsService.get('columnApi')!,
            context: this.gridOptionsService.get('context'),
            colDef: this.params.colDef,
            column: this.params.column,
        };

        this.renderCell(params);
    }

    public getTooltipParams(): WithoutGridCommon<ITooltipParams> {
        const res = super.getTooltipParams();
        res.location = 'setFilterValue';
        res.colDef = this.getComponentHolder();
        return res;
    }

    private getFormattedValue(column: Column, value: any) {
        return this.valueFormatterService.formatValue(column, null, value, this.valueFormatter, false);
    }

    private renderCell(params: ISetFilterCellRendererParams): void {
        const compDetails = this.userComponentFactory.getSetFilterCellRendererDetails(this.params, params);
        const cellRendererPromise = compDetails ? compDetails.newAgStackInstance() : undefined;

        if (cellRendererPromise == null) {
            let valueToRender = (params.valueFormatted == null ? params.value : params.valueFormatted) ?? this.translate('blanks');
            if (typeof valueToRender !== 'string') {
                _.doOnce(() => console.warn(
                        'AG Grid: Set Filter Value Formatter must return string values. Check that complex objects are being handled correctly, or enable convertValuesToStrings.'
                    ), 'setFilterComplexObjectsValueFormatter'
                );
                valueToRender = '';
            }

            this.eCheckbox.setLabel(valueToRender);
            this.setupFixedAriaLabels(valueToRender)

            return;
        }

        cellRendererPromise.then(component => {
            if (component) {
                this.eCheckbox.setLabel(component.getGui());
                this.addDestroyFunc(() => this.destroyBean(component));
            }
        });
    }

    public getComponentHolder(): ColDef {
        return this.params.column.getColDef();
    }
}
