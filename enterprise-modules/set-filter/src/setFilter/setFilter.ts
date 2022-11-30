import {
    AgInputTextField,
    Autowired,
    CellValueChangedEvent,
    Component,
    Events,
    IDoesFilterPassParams,
    ISetFilterParams,
    ProvidedFilter,
    RefSelector,
    ValueFormatterService,
    VirtualList,
    VirtualListModel,
    IAfterGuiAttachedParams,
    AgPromise,
    KeyCode,
    KeyCreatorParams,
    PositionableFeature,
    ResizableStructure,
    _,
    ISetFilter,
    SetFilterModel,
    RowNode,
    SetFilterModelValue,
    ValueFormatterParams,
    ColumnModel,
    ValueService,
    GetDataPath,
} from '@ag-grid-community/core';
import { SetFilterModelValuesType, SetValueModel } from './setValueModel';
import { SetFilterListItem, SetFilterListItemExpandedChangedEvent, SetFilterListItemSelectionChangedEvent } from './setFilterListItem';
import { ISetFilterLocaleText, DEFAULT_LOCALE_TEXT } from './localeText';
import { SetFilterModelTreeItem } from './iSetDisplayValueModel';

/** @param V type of value in the Set Filter */
export class SetFilter<K extends string | string[] = string, V = string> extends ProvidedFilter<SetFilterModel<K>, V> implements ISetFilter<K, V> {
    public static readonly SELECT_ALL_VALUE = '__AG_SELECT_ALL__';

    @RefSelector('eMiniFilter') private readonly eMiniFilter: AgInputTextField;
    @RefSelector('eFilterLoading') private readonly eFilterLoading: HTMLElement;
    @RefSelector('eSetFilterList') private readonly eSetFilterList: HTMLElement;
    @RefSelector('eFilterNoMatches') private readonly eNoMatches: HTMLElement;

    @Autowired('valueFormatterService') private readonly valueFormatterService: ValueFormatterService;
    @Autowired('columnModel') private readonly columnModel: ColumnModel;
    @Autowired('valueService') private readonly valueService: ValueService;

    private valueModel: SetValueModel<K, V> | null = null;
    private setFilterParams: ISetFilterParams<any, V> | null = null;
    private virtualList: VirtualList | null = null;
    private positionableFeature: PositionableFeature;
    private caseSensitive: boolean = false;
    private convertValuesToStrings: boolean = false;
    private treeDataTreeList = false;
    private getDataPath?: GetDataPath<any>;
    private groupingTreeList = false;

    private noAppliedModelKeys: boolean = false;
    private appliedModelWrapper: AppliedModel<K>;

    private createKey: (value: V | null, node?: RowNode | null) => string | null;

    private valueFormatter: (params: ValueFormatterParams) => string;

    constructor() {
        super('setFilter');
    }

    protected postConstruct() {
        super.postConstruct();
        this.positionableFeature = new PositionableFeature(this.eSetFilterList, { forcePopupParentAsOffsetParent: true });
        this.createBean(this.positionableFeature);
    }

    // unlike the simple filters, nothing in the set filter UI shows/hides.
    // maybe this method belongs in abstractSimpleFilter???
    protected updateUiVisibility(): void { }

    protected createBodyTemplate(): string {
        return /* html */`
            <div class="ag-set-filter">
                <div ref="eFilterLoading" class="ag-filter-loading ag-hidden">${this.translateForSetFilter('loadingOoo')}</div>
                <ag-input-text-field class="ag-mini-filter" ref="eMiniFilter"></ag-input-text-field>
                <div ref="eFilterNoMatches" class="ag-filter-no-matches ag-hidden">${this.translateForSetFilter('noMatches')}</div>
                <div ref="eSetFilterList" class="ag-set-filter-list" role="presentation"></div>
            </div>`;
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        super.handleKeyDown(e);

        if (e.defaultPrevented) { return; }

        switch (e.key) {
            case KeyCode.SPACE:
                this.handleKeySpace(e);
                break;
            case KeyCode.ENTER:
                this.handleKeyEnter(e);
                break;
            case KeyCode.LEFT:
                this.handleKeyLeft(e);
                break;
            case KeyCode.RIGHT:
                this.handleKeyRight(e);
                break;
        }
    }

    private handleKeySpace(e: KeyboardEvent): void {
        this.getComponentForKeyEvent(e)?.toggleSelected();
    }

    private handleKeyEnter(e: KeyboardEvent): void {
        if (!this.setFilterParams) { return; }

        const { excelMode, readOnly } = this.setFilterParams || {};
        if (!excelMode || !!readOnly) { return; }

        e.preventDefault();

        // in Excel Mode, hitting Enter is the same as pressing the Apply button
        this.onBtApply(false, false, e);

        if (this.setFilterParams.excelMode === 'mac') {
            // in Mac version, select all the input text
            this.eMiniFilter.getInputElement().select();
        }
    }

    private handleKeyLeft(e: KeyboardEvent): void {
        this.getComponentForKeyEvent(e)?.setExpanded(false);
    }

    private handleKeyRight(e: KeyboardEvent): void {
        this.getComponentForKeyEvent(e)?.setExpanded(true);
    }

    private getComponentForKeyEvent(e: KeyboardEvent): SetFilterListItem<V> | undefined {
        const eDocument = this.gridOptionsWrapper.getDocument();
        if (!this.eSetFilterList.contains(eDocument.activeElement) || !this.virtualList) { return; }

        const currentItem = this.virtualList.getLastFocusedRow();
        if (currentItem == null) { return; }

        const component = this.virtualList.getComponentAt(currentItem) as SetFilterListItem<V>;
        if (component == null) { return ; }

        e.preventDefault();

        const { readOnly } = this.setFilterParams ?? {};
        if (!!readOnly) { return; }
        return component;
    }

    protected getCssIdentifier(): string {
        return 'set-filter';
    }

    public setModel(model: SetFilterModel<K> | null): AgPromise<void> {
        if (model == null && this.valueModel?.getModel() == null) {
            // refreshing is expensive. if new and old model are both null (e.g. nothing set), skip.
            // mini filter isn't contained within the model, so always reset
            this.setMiniFilter(null);
            return AgPromise.resolve();
        }
        return super.setModel(model);
    }

    private setModelAndRefresh(values: SetFilterModelValue<K> | null): AgPromise<void> {
        return this.valueModel ? this.valueModel.setModel(values).then(() => this.refresh()) : AgPromise.resolve();
    }

    protected resetUiToDefaults(): AgPromise<void> {
        this.setMiniFilter(null);

        return this.setModelAndRefresh(null);
    }

    protected setModelIntoUi(model: SetFilterModel<K> | null): AgPromise<void> {
        this.setMiniFilter(null);

        const values = model == null ? null : model.values;
        return this.setModelAndRefresh(values);
    }

    public getModelFromUi(): SetFilterModel<K> | null {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        const values = this.valueModel.getModel();

        if (!values) { return null; }

        return { values, filterType: this.getFilterType() };
    }

    public getFilterType(): 'set' {
        return 'set';
    }

    public getValueModel(): SetValueModel<K, V> | null {
        return this.valueModel;
    }

    protected areModelsEqual(a: SetFilterModel<K>, b: SetFilterModel<K>): boolean {
        // both are missing
        if (a == null && b == null) { return true; }

        return a != null && b != null && _.areEqual(a.values, b.values);
    }

    public setParams(params: ISetFilterParams<any, V>): void {
        this.applyExcelModeOptions(params);

        super.setParams(params);

        this.setFilterParams = params;
        this.convertValuesToStrings = !!params.convertValuesToStrings;
        this.caseSensitive = !!params.caseSensitive;
        let keyCreator = params.keyCreator ?? params.colDef.keyCreator;
        this.setValueFormatter(params.valueFormatter, keyCreator, this.convertValuesToStrings);
        this.setCreateKey(keyCreator, this.convertValuesToStrings);
        this.treeDataTreeList = this.gridOptionsService.is('treeData') && !!params.treeList;
        this.getDataPath = this.gridOptionsService.get('getDataPath');
        this.groupingTreeList = !!this.columnModel.getRowGroupColumns().length;

        this.appliedModelWrapper = this.treeDataTreeList || this.groupingTreeList ? new AppliedModelGroupKeys() : new AppliedModelKeys(this.caseFormat) as any;

        this.valueModel = new SetValueModel(
            params,
            loading => this.showOrHideLoadingScreen(loading),
            this.valueFormatterService,
            key => this.translateForSetFilter(key),
            v => this.caseFormat(v),
            this.createKey,
            this.valueFormatter,
            !!keyCreator,
            this.gridOptionsService,
            this.columnModel,
            this.valueService,
            this.treeDataTreeList,
            this.groupingTreeList
        );

        this.initialiseFilterBodyUi();

        this.addEventListenersForDataChanges();
    }

    private setValueFormatter(
        providedValueFormatter: ((params: ValueFormatterParams) => string) | undefined,
        keyCreator: ((params: KeyCreatorParams<any, any>) => string) | undefined,
        convertValuesToStrings: boolean
    ) {
        let valueFormatter = providedValueFormatter;
        if (!valueFormatter) {
            if (keyCreator && !convertValuesToStrings) {
                throw new Error('AG Grid: Must supply a Value Formatter in Set Filter params when using a Key Creator unless convertValuesToStrings is enabled');
            }
            valueFormatter = params => _.toStringOrNull(params.value)!;
        }
        this.valueFormatter = valueFormatter;
    }

    private setCreateKey(keyCreator: ((params: KeyCreatorParams<any, any>) => string) | undefined, convertValuesToStrings: boolean): void {
        if (keyCreator) {
            this.createKey = (value, node = null) => {
                const params = this.getKeyCreatorParams(value, node);
                return _.makeNull(keyCreator!(params));
            };
        } else {
            if (convertValuesToStrings) {
                // for backwards compatibility - keeping separate as it will eventually be removed
                this.createKey = value => Array.isArray(value) ? value as any : _.makeNull(_.toStringOrNull(value));
            } else {
                this.createKey = value => _.makeNull(_.toStringOrNull(value));
            }
        }
    }

    public getValueFormatter() {
        return this.valueFormatter;
    }

    private applyExcelModeOptions(params: ISetFilterParams<any, V>): void {
        // apply default options to match Excel behaviour, unless they have already been specified
        if (params.excelMode === 'windows') {
            if (!params.buttons) {
                params.buttons = ['apply', 'cancel'];
            }

            if (params.closeOnApply == null) {
                params.closeOnApply = true;
            }
        } else if (params.excelMode === 'mac') {
            if (!params.buttons) {
                params.buttons = ['reset'];
            }

            if (params.applyMiniFilterWhileTyping == null) {
                params.applyMiniFilterWhileTyping = true;
            }

            if (params.debounceMs == null) {
                params.debounceMs = 500;
            }
        }
    }

    private addEventListenersForDataChanges(): void {
        if (!this.isValuesTakenFromGrid()) { return; }

        this.addManagedListener(
            this.eventService,
            Events.EVENT_CELL_VALUE_CHANGED,
            (event: CellValueChangedEvent) => {
                // only interested in changes to do with this column
                if (this.setFilterParams && event.column === this.setFilterParams.column) {
                    this.syncAfterDataChange();
                }
            });
    }

    private syncAfterDataChange(): AgPromise<void> {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        let promise = this.valueModel.refreshValues();

        return promise.then(() => {
            this.refresh();
            this.onBtApply(false, true);
        });
    }

    private showOrHideLoadingScreen(isLoading: boolean): void {
        _.setDisplayed(this.eFilterLoading, isLoading);
    }

    private initialiseFilterBodyUi(): void {
        this.initVirtualList();
        this.initMiniFilter();
    }

    private initVirtualList(): void {
        if (!this.setFilterParams) { throw new Error('Set filter params have not been provided.'); }
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        const translate = this.gridOptionsWrapper.getLocaleTextFunc();
        const filterListName = translate('ariaFilterList', 'Filter List');
        const isTree = !!this.setFilterParams.treeList;

        const virtualList = this.virtualList = this.createBean(new VirtualList('filter', isTree ? 'tree' : 'listbox', filterListName));
        const eSetFilterList = this.getRefElement('eSetFilterList');

        if (eSetFilterList) {
            eSetFilterList.appendChild(virtualList.getGui());
        }

        const { cellHeight } = this.setFilterParams;

        if (cellHeight != null) {
            virtualList.setRowHeight(cellHeight);
        }

        const componentCreator = (item: SetFilterModelTreeItem<K> | K | null, listItemElement: HTMLElement) => this.createSetListItem(item, isTree, listItemElement);
        virtualList.setComponentCreator(componentCreator);

        let model: VirtualListModel;

        if (this.setFilterParams.suppressSelectAll) {
            model = new ModelWrapper(this.valueModel);
        } else {
            model = new ModelWrapperWithSelectAll(this.valueModel, () => this.isSelectAllSelected());
        }
        if (isTree) {
            model = new TreeModelWrapper(model);
        }

        virtualList.setModel(model);
    }

    private getSelectAllLabel(): string {
        if (!this.setFilterParams) { throw new Error('Set filter params have not been provided.'); }
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        const key = this.valueModel.getMiniFilter() == null || !this.setFilterParams.excelMode ?
            'selectAll' : 'selectAllSearchResults';

        return this.translateForSetFilter(key);
    }

    private createSetListItem(item: SetFilterModelTreeItem<K> | typeof SetFilter.SELECT_ALL_VALUE | K | null, isTree: boolean, listItemElement: HTMLElement): Component {
        if (!this.setFilterParams) { throw new Error('Set filter params have not been provided.'); }
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        let listItem: SetFilterListItem<V | string | null>;

        if (item === SetFilter.SELECT_ALL_VALUE) {
            listItem = this.createBean(new SetFilterListItem<V>(
                listItemElement,
                () => this.getSelectAllLabel(),
                this.setFilterParams as any,
                translateKey => this.translateForSetFilter(translateKey),
                this.valueFormatter,
                this.isSelectAllSelected(),
                isTree,
                0,
                this.valueModel.hasGroups(),
                false));

            listItem.addEventListener(
                SetFilterListItem.EVENT_SELECTION_CHANGED,
                (e: SetFilterListItemSelectionChangedEvent) => this.onSelectAll(e.isSelected)
            );

            return listItem;
        }

        if (this.isSetFilterModelTreeItem(item) && item.children) {
            listItem = this.createBean(new SetFilterListItem(
                listItemElement,
                this.setFilterParams.treeListFormatter?.(item.treeKey, item.depth) ?? item.treeKey,
                this.setFilterParams as any,
                translateKey => this.translateForSetFilter(translateKey),
                this.valueFormatter,
                this.areAllChildrenSelected(item),
                isTree,
                item.depth,
                this.valueModel.hasGroups(),
                true,
                item.expanded));
    
            listItem.addEventListener(
                SetFilterListItem.EVENT_SELECTION_CHANGED,
                (e: SetFilterListItemSelectionChangedEvent) => this.onGroupItemSelected(item, e.isSelected)
            );
            listItem.addEventListener(
                SetFilterListItem.EVENT_EXPANDED_CHANGED,
                (e: SetFilterListItemExpandedChangedEvent) => this.onExpandedChanged(item, e.isExpanded)
            );
    
            return listItem;
        }

        let depth: number, expanded: boolean, value: V | string | null, key: K | null;
        if (this.isSetFilterModelTreeItem(item)) {
            depth = item.depth;
            expanded = !!item.expanded;
            value = this.setFilterParams.treeListFormatter?.(item.treeKey, item.depth) ?? item.treeKey,
            key = item.key!;
        } else {
            depth = 0;
            expanded = false;
            value = this.valueModel.getValue(item);
            key = item;
        }

        listItem = this.createBean(new SetFilterListItem(
            listItemElement,
            value,
            this.setFilterParams as any,
            translateKey => this.translateForSetFilter(translateKey),
            this.valueFormatter,
            this.valueModel.isKeySelected(key),
            isTree,
            depth,
            this.valueModel.hasGroups(),
            false,
            expanded));

        listItem.addEventListener(
            SetFilterListItem.EVENT_SELECTION_CHANGED,
            (e: SetFilterListItemSelectionChangedEvent) => this.onItemSelected(key, e.isSelected)
        );

        return listItem;
    }

    private isSetFilterModelTreeItem(item: any): item is SetFilterModelTreeItem<K> {
        return item?.treeKey !== undefined;
    }

    private initMiniFilter() {
        if (!this.setFilterParams) { throw new Error('Set filter params have not been provided.'); }
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        const { eMiniFilter, gridOptionsWrapper } = this;
        const translate = gridOptionsWrapper.getLocaleTextFunc();

        eMiniFilter.setDisplayed(!this.setFilterParams.suppressMiniFilter);
        eMiniFilter.setValue(this.valueModel.getMiniFilter());
        eMiniFilter.onValueChange(() => this.onMiniFilterInput());
        eMiniFilter.setInputAriaLabel(translate('ariaSearchFilterValues', 'Search filter values'));

        this.addManagedListener(eMiniFilter.getInputElement(), 'keypress', e => this.onMiniFilterKeyPress(e));
    }

    // we need to have the GUI attached before we can draw the virtual rows, as the
    // virtual row logic needs info about the GUI state
    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        if (!this.setFilterParams) { throw new Error('Set filter params have not been provided.'); }

        super.afterGuiAttached(params);

        if (this.setFilterParams.excelMode) {
            this.resetUiToActiveModel();
            this.showOrHideResults();
        }

        this.refreshVirtualList();

        const { eMiniFilter } = this;

        eMiniFilter.setInputPlaceholder(this.translateForSetFilter('searchOoo'));

        if (!params || !params.suppressFocus) {
            eMiniFilter.getFocusableElement().focus();
        }

        const resizable = !!(params && params.container === 'floatingFilter');
        let resizableObject: ResizableStructure;

        if (this.gridOptionsService.is('enableRtl')) {
            resizableObject = { bottom: true, bottomLeft: true, left: true };
        } else {
            resizableObject = { bottom: true, bottomRight: true, right: true };
        }

        if (resizable) {
            this.positionableFeature.restoreLastSize();
            this.positionableFeature.setResizable(resizableObject);
        } else {
            this.positionableFeature.removeSizeFromEl();
            this.positionableFeature.setResizable(false);
        }
    }

    public applyModel(): boolean {
        if (!this.setFilterParams) { throw new Error('Set filter params have not been provided.'); }
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        if (this.setFilterParams.excelMode && this.valueModel.isEverythingVisibleSelected()) {
            // In Excel, if the filter is applied with all visible values selected, then any active filter on the
            // column is removed. This ensures the filter is removed in this situation.
            this.valueModel.selectAllMatchingMiniFilter();
        }

        const result = super.applyModel();

        // keep appliedModelWrapper in sync with the applied model
        const appliedModel = this.getModel();

        this.appliedModelWrapper.applyModel(appliedModel);

        this.noAppliedModelKeys = appliedModel?.values.length === 0;

        return result;
    }

    protected isModelValid(model: SetFilterModel<K>): boolean {
        return this.setFilterParams && this.setFilterParams.excelMode ? model == null || model.values.length > 0 : true;
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        if (!this.setFilterParams || !this.valueModel || !this.appliedModelWrapper.exists()) { return true; }

        // if nothing selected, don't need to check value
        if (this.noAppliedModelKeys) {
            return false;
        }

        const { node, data } = params;
        if (this.treeDataTreeList) {
            if (node.childrenAfterGroup?.length) {
                // only perform checking on leaves. The core filtering logic for tree data won't work properly otherwise
                return false;
            }
            return this.appliedModelWrapper.has(this.getDataPath!(data) as any);
        }
        if (this.groupingTreeList) {
            const dataPath = this.columnModel.getRowGroupColumns().map(groupCol => this.valueService.getKeyForNode(groupCol, node));
            dataPath.push(_.toStringOrNull(_.makeNull(this.getValueFromNode(node, data))));
            return this.appliedModelWrapper.has(dataPath as any);
        }

        
        let value = this.getValueFromNode(node, data);

        if (this.convertValuesToStrings) {
            // for backwards compatibility - keeping separate as it will eventually be removed
            const key = this.createKey(value, node);
            if (key != null && Array.isArray(key)) {
                return key.some(v => this.appliedModelWrapper.has(v));
            }

            return this.appliedModelWrapper.has(key as any);
        } else {
            if (value != null && Array.isArray(value)) {
                return value.some(v => this.appliedModelWrapper.has(this.createKey(v, node) as any));
            }
    
            return this.appliedModelWrapper.has(this.createKey(value, node) as any);
        }
    }

    private getValueFromNode(node: RowNode, data: any): V | null {
        const { valueGetter, api, colDef, column, columnApi, context } = this.setFilterParams!;

        return valueGetter({
            api,
            colDef,
            column,
            columnApi,
            context,
            data: data,
            getValue: (field) => data[field],
            node: node,
        });
    }

    private getKeyCreatorParams(value: V | null, node: RowNode | null = null): KeyCreatorParams {
        return {
            value,
            colDef: this.setFilterParams!.colDef,
            column: this.setFilterParams!.column,
            node: node,
            data: node?.data,
            api: this.setFilterParams!.api,
            columnApi: this.setFilterParams!.columnApi,
            context: this.setFilterParams!.context
        }
    }

    public onNewRowsLoaded(): void {
        if (!this.isValuesTakenFromGrid()) { return; }
        this.syncAfterDataChange();
    }

    private isValuesTakenFromGrid(): boolean {
        if (!this.valueModel) { return false; }
        const valuesType = this.valueModel.getValuesType();
        return valuesType === SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Public method provided so the user can change the value of the filter once
     * the filter has been already started
     * @param values The values to use.
     */
    public setFilterValues(values: (V | null)[]): void {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        this.valueModel.overrideValues(values).then(() => {
            this.refresh();
            this.onUiChanged();
        });
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Public method provided so the user can reset the values of the filter once that it has started.
     */
    public resetFilterValues(): void {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        this.valueModel.setValuesType(SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES);
        this.syncAfterDataChange();
    }

    public refreshFilterValues(): void {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        // the model is still being initialised
        if (!this.valueModel.isInitialised()) { return; }

        this.valueModel.refreshValues().then(() => {
            this.refresh();
            this.onUiChanged();
        });
    }

    public onAnyFilterChanged(): void {
        // don't block the current action when updating the values for this filter
        setTimeout(() => {
            if (!this.isAlive()) { return; }

            if (!this.valueModel) { throw new Error('Value model has not been created.'); }

            this.valueModel.refreshAfterAnyFilterChanged().then(refresh => {
                if (refresh) { this.refresh(); }
            });
        }, 0);
    }

    private onMiniFilterInput() {
        if (!this.setFilterParams) { throw new Error('Set filter params have not been provided.'); }
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        if (!this.valueModel.setMiniFilter(this.eMiniFilter.getValue())) { return; }

        const { applyMiniFilterWhileTyping, readOnly } = this.setFilterParams || {};
        if (!readOnly && applyMiniFilterWhileTyping) {
            this.filterOnAllVisibleValues(false);
        } else {
            this.updateUiAfterMiniFilterChange();
        }
    }

    private updateUiAfterMiniFilterChange(): void {
        if (!this.setFilterParams) { throw new Error('Set filter params have not been provided.'); }
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        const { excelMode, readOnly } = this.setFilterParams || {};
        if (excelMode == null || !!readOnly) {
            this.refresh();
        } else if (this.valueModel.getMiniFilter() == null) {
            this.resetUiToActiveModel();
        } else {
            this.valueModel.selectAllMatchingMiniFilter(true);
            this.refresh();
            this.onUiChanged();
        }

        this.showOrHideResults();
    }

    private showOrHideResults(): void {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        const hideResults = this.valueModel.getMiniFilter() != null && this.valueModel.getDisplayedValueCount() < 1;

        _.setDisplayed(this.eNoMatches, hideResults);
        _.setDisplayed(this.eSetFilterList, !hideResults);
    }

    private resetUiToActiveModel(): void {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }

        this.eMiniFilter.setValue(null, true);
        this.valueModel.setMiniFilter(null);
        this.setModelIntoUi(this.getModel()).then(() => this.onUiChanged(false, 'prevent'));
    }

    private onMiniFilterKeyPress(e: KeyboardEvent): void {
        const { excelMode, readOnly } = this.setFilterParams || {};
        if (e.key === KeyCode.ENTER && !excelMode && !readOnly) {
            this.filterOnAllVisibleValues();
        }
    }

    private filterOnAllVisibleValues(applyImmediately = true): void {
        const { readOnly } = this.setFilterParams || {};

        if (!this.valueModel) { throw new Error('Value model has not been created.'); }
        if (!!readOnly) { throw new Error('Unable to filter in readOnly mode.'); }

        this.valueModel.selectAllMatchingMiniFilter(true);
        this.refresh();
        this.onUiChanged(false, applyImmediately ? 'immediately' : 'debounce');
        this.showOrHideResults();
    }

    private focusRowIfAlive(rowIndex: number | null): void {
        if (rowIndex == null) { return; }

        window.setTimeout(() => {
            if (!this.virtualList) { throw new Error('Virtual list has not been created.'); }

            if (this.isAlive()) {
                this.virtualList.focusRow(rowIndex);
            }
        }, 0);
    }

    private onSelectAll(isSelected: boolean): void {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }
        if (!this.virtualList) { throw new Error('Virtual list has not been created.'); }

        if (isSelected) {
            this.valueModel.selectAllMatchingMiniFilter();
        } else {
            this.valueModel.deselectAllMatchingMiniFilter();
        }

        this.refreshAfterSelection();
    }

    private onGroupItemSelected(item: SetFilterModelTreeItem<K>, isSelected: boolean): void {
        const recursiveGroupSelection = (i: SetFilterModelTreeItem<K>) => {
            if (i.children) {
                i.children.forEach(childItem => recursiveGroupSelection(childItem));
            } else {
                this.selectItem(i.key!, isSelected);
            }
        };

        recursiveGroupSelection(item);

        this.refreshAfterSelection();
    }

    private onItemSelected(key: K | null, isSelected: boolean): void {
        if (!this.valueModel) { throw new Error('Value model has not been created.'); }
        if (!this.virtualList) { throw new Error('Virtual list has not been created.'); }

        this.selectItem(key, isSelected);

        this.refreshAfterSelection();
    }

    private selectItem(key: K | null, isSelected: boolean): void {
        if (isSelected) {
            this.valueModel!.selectKey(key);
        } else {
            this.valueModel!.deselectKey(key);
        }
    }

    private onExpandedChanged(item: SetFilterModelTreeItem<K>, isExpanded: boolean): void {
        item.expanded = isExpanded;

        const focusedRow = this.virtualList!.getLastFocusedRow();

        this.valueModel!.updateDisplayedValues(false, true);

        this.refresh();
        this.focusRowIfAlive(focusedRow);
    }

    private refreshAfterSelection(): void {
        const focusedRow = this.virtualList!.getLastFocusedRow();

        this.refresh();
        this.onUiChanged();
        this.focusRowIfAlive(focusedRow);
    }

    public setMiniFilter(newMiniFilter: string | null): void {
        this.eMiniFilter.setValue(newMiniFilter);
        this.onMiniFilterInput();
    }

    public getMiniFilter(): string | null {
        return this.valueModel ? this.valueModel.getMiniFilter() : null;
    }

    private refresh() {
        if (!this.virtualList) { throw new Error('Virtual list has not been created.'); }

        this.virtualList.refresh();
    }

    public getFilterKeys(): SetFilterModelValue<K> {
        return this.valueModel ? this.valueModel.getKeys() : [];
    }

    public getFilterValues(): (V | null)[] {
        return this.valueModel ? this.valueModel.getValues() : [];
    }

    public getValues(): SetFilterModelValue<K> {
        return this.getFilterKeys();
    }

    public refreshVirtualList(): void {
        if (this.setFilterParams && this.setFilterParams.refreshValuesOnOpen) {
            this.refreshFilterValues();
        } else {
            this.refresh();
        }
    }

    private translateForSetFilter(key: keyof ISetFilterLocaleText): string {
        const translate = this.gridOptionsWrapper.getLocaleTextFunc();

        return translate(key, DEFAULT_LOCALE_TEXT[key]);
    }

    private isSelectAllSelected(): boolean | undefined {
        if (!this.setFilterParams || !this.valueModel) { return false; }

        if (!this.setFilterParams.defaultToNothingSelected) {
            // everything selected by default
            if (this.valueModel.hasSelections() && this.valueModel.isNothingVisibleSelected()) {
                return false;
            }

            if (this.valueModel.isEverythingVisibleSelected()) {
                return true;
            }
        } else {
            // nothing selected by default
            if (this.valueModel.hasSelections() && this.valueModel.isEverythingVisibleSelected()) {
                return true;
            }

            if (this.valueModel.isNothingVisibleSelected()) {
                return false;
            }
        }
        // returning `undefined` means the checkbox status is indeterminate.
        return undefined;
    }

    private areAllChildrenSelected(item: SetFilterModelTreeItem<K>): boolean | undefined {
        const recursiveChildSelectionCheck = (i: SetFilterModelTreeItem<K>): boolean | undefined => {
            if (i.children) {
                let someTrue = false;
                let someFalse = false;
                const mixed = i.children.some(child => {
                    const childSelected = recursiveChildSelectionCheck(child);
                    if (childSelected === undefined) {
                        return true;
                    }
                    if (childSelected) {
                        someTrue = true;
                    } else {
                        someFalse = true;
                    }
                    return someTrue && someFalse;
                });
                // returning `undefined` means the checkbox status is indeterminate.
                // if not mixed and some true, all must be true
                return mixed ? undefined : someTrue;
            } else {
                return this.valueModel!.isKeySelected(i.key!);
            }
        };

        if (!this.setFilterParams!.defaultToNothingSelected) {
            // everything selected by default
            return recursiveChildSelectionCheck(item);
        } else {
            // nothing selected by default
            return this.valueModel!.hasSelections() && recursiveChildSelectionCheck(item);
        }
    }

    public destroy(): void {
        if (this.virtualList != null) {
            this.virtualList.destroy();
            this.virtualList = null;
        }

        super.destroy();
    }

    private caseFormat<T extends string | number | null>(valueToFormat: T): typeof valueToFormat {
        if (valueToFormat == null || typeof valueToFormat !== 'string') {
            return valueToFormat;
        }
        return this.caseSensitive ? valueToFormat : valueToFormat.toUpperCase() as T;
    }
}

class ModelWrapper<K extends string | string[], V> implements VirtualListModel {
    constructor(private readonly model: SetValueModel<K, V>) {
    }

    public getRowCount(): number {
        return this.model.getDisplayedValueCount();
    }

    public getRow(index: number): K | null {
        return this.model.getDisplayedItem(index) as any;
    }

    public isRowSelected(index: number): boolean {
        return this.model.isKeySelected(this.getRow(index));
    }
}

class ModelWrapperWithSelectAll<K extends string | string[], V> implements VirtualListModel {
    constructor(
        private readonly model: SetValueModel<K, V>,
        private readonly isSelectAllSelected: (() => boolean | undefined)) {
    }

    public getRowCount(): number {
        return this.model.getDisplayedValueCount() + 1;
    }

    public getRow(index: number): K | null {
        return index === 0 ? SetFilter.SELECT_ALL_VALUE as any : this.model.getDisplayedItem(index - 1);
    }

    public isRowSelected(index: number): boolean | undefined {
        return index === 0 ? this.isSelectAllSelected() : this.model.isKeySelected(this.getRow(index));
    }
}

// isRowSelected is used by VirtualList to add aria tags for flat lists. We want to suppress this when using trees
class TreeModelWrapper<K extends string | string[]> implements VirtualListModel {
    constructor(private readonly model: VirtualListModel) {}

    public getRowCount(): number {
        return this.model.getRowCount();
    }

    public getRow(index: number): SetFilterModelTreeItem<K> | null {
        return this.model.getRow(index);
    }
}

interface AppliedModel<K extends string | string[]> {
    applyModel(appliedModel: SetFilterModel<K> | null): void;

    has(key: K | null): boolean;

    exists(): boolean;
}

class AppliedModelKeys implements AppliedModel<string> {
    private appliedModelKeys: Set<string | null> | null = null;

    constructor(private readonly caseFormat:<T extends string | number | null>(valueToFormat: T) => typeof valueToFormat) {}

    public applyModel(appliedModel: SetFilterModel<string> | null): void {
        if (appliedModel) {
            this.appliedModelKeys = new Set();
            appliedModel.values.forEach(key => {
                this.appliedModelKeys!.add(this.caseFormat(key));
            });
        } else {
            this.appliedModelKeys = null;
        }
    }

    public has(key: string | null): boolean {
        return !!this.appliedModelKeys?.has(this.caseFormat(key));
    }

    public exists(): boolean {
        return !!this.appliedModelKeys;
    }
}

class AppliedModelGroupKeys implements AppliedModel<string[]> {
    private appliedModelGroupKeys: Map<string | null, (string[] | null)[]> | null = null;

    public applyModel(appliedModel: SetFilterModel<string[]> | null): void {
        if (appliedModel) {
            this.appliedModelGroupKeys = new Map();
            appliedModel.values.forEach(key => {
                const childKey = this.getChildKey(key);
                let groupKeys = this.appliedModelGroupKeys!.get(childKey);
                if (!groupKeys) {
                    groupKeys = [];
                    this.appliedModelGroupKeys!.set(childKey, groupKeys);
                }
                groupKeys!.push(key);
            });
        } else {
            this.appliedModelGroupKeys = null;
        }
    }

    public has(key: string[] | null): boolean {
        const childKey = this.getChildKey(key);
        const groupKeys = this.appliedModelGroupKeys?.get(childKey);
        if (!groupKeys) {
            return false;
        }
        return groupKeys.some(groupKey => _.areEqual(groupKey, key));
    }

    public exists(): boolean {
        return !!this.appliedModelGroupKeys;
    }

    private getChildKey(key: string[] | null): string | null {
        return key ? _.last(key) : null;
    }
}
