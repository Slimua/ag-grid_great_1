import { UserCompDetails, UserComponentFactory } from "../components/framework/userComponentFactory";
import { KeyCode } from "../constants/keyCode";
import { Autowired } from "../context/context";
import { Events } from "../eventKeys";
import { FieldPickerValueSelectedEvent } from "../events";
import { WithoutGridCommon } from "../interfaces/iCommon";
import { ICellRendererParams } from "../rendering/cellRenderers/iCellRenderer";
import { AgPromise } from "../utils";
import { setAriaControls } from "../utils/aria";
import { bindCellRendererToHtmlElement, clearElement } from "../utils/dom";
import { debounce } from "../utils/function";
import { fuzzySuggestions } from "../utils/fuzzyMatch";
import { exists } from "../utils/generic";
import { isEventFromPrintableCharacter } from "../utils/keyboard";
import { AgInputTextField } from "./agInputTextField";
import { AgPickerField, IPickerFieldParams } from "./agPickerField";
import { RichSelectRow } from "./agRichSelectRow";
import { Component } from "./component";
import { RefSelector } from "./componentAnnotations";
import { VirtualList } from "./virtualList";

export interface RichSelectParams<TValue = any> extends IPickerFieldParams {
    value?: TValue;
    valueList?: TValue[]
    allowTyping?: boolean;
    cellRenderer?: any;
    cellRowHeight?: number;
    searchDebounceDelay?: number;

    filterList?: boolean;
    searchType?: 'match' | 'matchAny' | 'fuzzy';

    valueFormatter?: (value: TValue) => any;
    searchStringCreator?: (values: TValue[]) => string[]
}

const TEMPLATE = /* html */`
    <div class="ag-picker-field" role="presentation">
        <div ref="eLabel"></div>
            <div ref="eWrapper" class="ag-wrapper ag-picker-field-wrapper ag-picker-collapsed">
            <div ref="eDisplayField" class="ag-picker-field-display"></div>
            <ag-input-text-field ref="eInput" class="ag-rich-select-field-input"></ag-input-text-field>
            <div ref="eIcon" class="ag-picker-field-icon" aria-hidden="true"></div>
        </div>
    </div>`;

export class AgRichSelect<TValue = any> extends AgPickerField<TValue, RichSelectParams<TValue>, VirtualList> {

    private searchString = '';
    private listComponent: VirtualList | undefined;
    private values: TValue[];
    private currentList: TValue[];
    private cellRowHeight: number;
    private highlightedItem: number = -1;

    @Autowired('userComponentFactory') private userComponentFactory: UserComponentFactory;
    @RefSelector('eInput') private eInput: AgInputTextField;
    

    constructor(config?: RichSelectParams<TValue>) {
        super({
            pickerAriaLabelKey: 'ariaLabelRichSelectField',
            pickerAriaLabelValue: 'Rich Select Field',
            pickerType: 'ag-list',
            className: 'ag-rich-select',
            pickerIcon: 'smallDown',
            ariaRole: 'combobox',
            template: TEMPLATE,
            modalPicker: false,
            ...config,
            // maxPickerHeight needs to be set after expanding `config`
            maxPickerHeight: config?.maxPickerHeight ?? 'calc(var(--ag-row-height) * 6.5)',
        });

        const { cellRowHeight, value, valueList } = config || {};

        if (cellRowHeight != null) {
            this.cellRowHeight = cellRowHeight;
        }

        if (value != null) {
            this.value = value;
        }

        if (valueList != null) {
            this.values = valueList;
        }
    }

    protected postConstruct(): void {
        super.postConstruct();
        this.createListComponent();

        const { allowTyping } = this.config;

        if (allowTyping) {
            this.eDisplayField.classList.add('ag-hidden');
        } else {
            this.eInput.setDisplayed(false);
        }

        this.eWrapper.tabIndex = this.gridOptionsService.getNum('tabIndex') ?? 0;
        this.eWrapper.classList.add('ag-rich-select-value');

        const { searchDebounceDelay = 300 } = this.config;
        this.clearSearchString = debounce(this.clearSearchString, searchDebounceDelay);

        this.renderSelectedValue();

        if (allowTyping) {
            this.eInput.onValueChange(value => this.searchTextFromString(value));
            this.addManagedListener(this.eWrapper, 'focus', this.onWrapperFocus.bind(this));
        }
        this.addManagedListener(this.eWrapper, 'focusout', this.onWrapperFocusOut.bind(this));

    }

    private createListComponent(): void {
        this.listComponent = this.createBean(new VirtualList({ cssIdentifier: 'rich-select' }))
        this.listComponent.setComponentCreator(this.createRowComponent.bind(this));
        this.listComponent.setParentComponent(this);

        this.addManagedListener(this.listComponent, Events.EVENT_FIELD_PICKER_VALUE_SELECTED, (e: FieldPickerValueSelectedEvent) => {
            this.onListValueSelected(e.value, e.fromEnterKey);
        });
        
        const { cellRowHeight } = this;
        if (cellRowHeight) {
            this.listComponent.setRowHeight(cellRowHeight);
        }

        const eListGui = this.listComponent.getGui();
        const eListAriaEl = this.listComponent.getAriaElement();

        this.addManagedListener(eListGui, 'mousemove', this.onPickerMouseMove.bind(this));
        this.addManagedListener(eListGui, 'mousedown', e => e.preventDefault());
        eListGui.classList.add('ag-rich-select-list');

        const listId = `ag-rich-select-list-${this.listComponent.getCompId()}`;
        eListAriaEl.setAttribute('id', listId);
        setAriaControls(this.eWrapper, eListAriaEl);
    }

    private renderSelectedValue(): void {
        const { value, eDisplayField, config } = this;
        const valueFormatted = this.config.valueFormatter ? this.config.valueFormatter(value) : value;

        if (config.allowTyping) {
            this.eInput.setValue(valueFormatted);
            return;
        }

        let userCompDetails: UserCompDetails | undefined;

        if (config.cellRenderer) {
            userCompDetails = this.userComponentFactory.getCellRendererDetails(this.config, {
                value,
                valueFormatted,
                api: this.gridOptionsService.api
            } as ICellRendererParams);
        }

        let userCompDetailsPromise: AgPromise<any> | undefined;

        if (userCompDetails) {
            userCompDetailsPromise = userCompDetails.newAgStackInstance();
        }

        if (userCompDetailsPromise) {
            clearElement(eDisplayField);
            bindCellRendererToHtmlElement(userCompDetailsPromise, eDisplayField);
            userCompDetailsPromise.then(renderer => {
                this.addDestroyFunc(() => this.getContext().destroyBean(renderer));
            });
        } else {
            if (exists(this.value)) {
                eDisplayField.innerText = valueFormatted;
            } else {
                clearElement(eDisplayField);
            }
        }
    }

    private getCurrentValueIndex(): number {
        const { currentList, value } = this;

        if (value == null) { return -1; }

        for (let i = 0; i < currentList.length; i++) {
            if (currentList[i] === value) {
                return i;
            }
        }

        return -1;
    }

    private highlightSelectedValue(index?: number): void {
        if (index == null) {
            index = this.getCurrentValueIndex();
        }

        this.highlightedItem = index;

        if (this.listComponent) {
            this.listComponent.forEachRenderedRow((cmp: RichSelectRow<TValue>, idx: number) => {
                const highlighted = index === -1 ? false : this.highlightedItem === idx;
                cmp.updateHighlighted(highlighted);
            });
        }
    }

    public setRowHeight(height: number): void {
        if (height !== this.cellRowHeight) {
            this.cellRowHeight = height;
        }

        if (this.listComponent) {
            this.listComponent.setRowHeight(height);
        }
    }

    protected createPickerComponent() {
        const { values }  = this;

        this.updateListModel(values);

        // do not create the picker every time to save state
        return this.listComponent!;
    }

    private updateListModel(valueList: TValue[]): void {
        if (!this.listComponent) { return; }

        if (this.currentList === valueList) { return; }

        this.currentList = valueList;

        this.listComponent.setModel({
            getRowCount: () => valueList.length,
            getRow: (index: number) => valueList[index]
        });
    }

    public showPicker() {
        super.showPicker();
        const currentValueIndex = this.getCurrentValueIndex();

        if (!this.listComponent) { return; }

        if (currentValueIndex !== -1) {
            // make sure the virtual list has been sized correctly
            this.listComponent.refresh();
            this.listComponent.ensureIndexVisible(currentValueIndex);
            // this second call to refresh is necessary to force scrolled elements
            // to be rendered with the correct index info.
            this.listComponent.refresh(true);
            this.highlightSelectedValue(currentValueIndex);
        } else {
            this.listComponent.refresh();
        }
    }

    protected beforeHidePicker(): void {
        this.highlightedItem = -1;
        super.beforeHidePicker();
    }

    private onWrapperFocus(e: FocusEvent): void {
        if (this.eInput) {
            this.eInput.getFocusableElement().focus();
        }
    }

    private onWrapperFocusOut(e: FocusEvent): void {
        if (!this.eWrapper.contains(e.relatedTarget as Element)) {
            this.hidePicker();
        }
    }

    private buildSearchStringFromKeyboardEvent(searchKey: KeyboardEvent) {
        let { key } = searchKey;

        if (key === KeyCode.BACKSPACE) {
            this.searchString = this.searchString.slice(0, -1);
            key = '';
        } else if (!isEventFromPrintableCharacter(searchKey)) {
            return;
        }

        searchKey.preventDefault();

        this.searchTextFromCharacter(key);
    }

    private searchTextFromCharacter(char: string): void {
        this.searchString += char;
        this.runSearch();
        this.clearSearchString();
    }

    public searchTextFromString(str: string | null | undefined): void {
        if (str == null) { str = ''; }
        this.searchString = str;
        this.runSearch();
    }

    private buildSearchStrings(values: TValue[]): string[] | undefined {
        const { valueFormatter = (value => value), searchStringCreator } = this.config;

        let searchStrings: string[] | undefined;
        if (typeof values[0] === 'number' || typeof values[0] === 'string') {
            searchStrings = values.map(v => valueFormatter(v));
        } else if (typeof values[0] === 'object' && searchStringCreator) {
            searchStrings = searchStringCreator(values);
        }

        return searchStrings;
    }

    private getSuggestionsAndFilteredValues(searchValue: string, valueList: string[]): { suggestions: string[], filteredValues: TValue[] } {
        let suggestions: string[] = [];
        let filteredValues: TValue[] = [];

        if (!searchValue.length) { return { suggestions, filteredValues } };

        const { searchType = 'fuzzy', filterList } = this.config;

        if (searchType === 'fuzzy') {
            const fuzzySearchResult = fuzzySuggestions(this.searchString, valueList, true);
            suggestions = fuzzySearchResult.values;

            const indices = fuzzySearchResult.indices;
            if (filterList && indices.length) {
                for (let i = 0; indices.length; i++) {
                    filteredValues.push(this.values[indices[i]]);
                }
            }
        } else {
            suggestions = valueList.filter((val, idx) => {
                const currentValue = val.toLocaleLowerCase();
                const valueToMatch = this.searchString.toLocaleLowerCase();

                const isMatch = searchType === 'match' ? currentValue.startsWith(valueToMatch) : currentValue.indexOf(valueToMatch) !== -1;
                if (filterList && isMatch) {
                    filteredValues.push(this.values[idx]);
                }
                return isMatch;
            });
        }

        return { suggestions, filteredValues };
    }

    private filterListModel(filteredValues: TValue[]): void {
        const { filterList } = this.config;
        if (!filterList) { return; }

        this.updateListModel(filteredValues);
        this.listComponent?.refresh();
    }

    private runSearch() {
        const { values } = this;
        const searchStrings = this.buildSearchStrings(values);

        if (!searchStrings) {
            this.highlightSelectedValue(-1);
            return;
        }

        const { suggestions, filteredValues } = this.getSuggestionsAndFilteredValues(this.searchString, searchStrings);
        const { filterList } = this.config;

        const shouldFilter = filterList && this.searchString !== '';

        if (filterList) {
            this.filterListModel(shouldFilter ? filteredValues : values);
        }

        if (suggestions.length) {
            const topSuggestionIndex = filterList ? 0 : searchStrings.indexOf(suggestions[0]);
            this.selectListItem(topSuggestionIndex);
        } else {
            this.highlightSelectedValue(-1);
            if (!filterList || filteredValues.length) {
                this.listComponent?.ensureIndexVisible(0);
            }
        }
    }

    private clearSearchString(): void {
        this.searchString = '';
    }

    private selectListItem(index: number, preventUnnecessaryScroll?: boolean): void {
        if (!this.isPickerDisplayed || !this.listComponent || index < 0 || index >= this.currentList.length) { return; }

        this.listComponent.ensureIndexVisible(index, !preventUnnecessaryScroll);
        this.listComponent.refresh(true);
        this.highlightSelectedValue(index);
    }

    public setValue(value: TValue, silent?: boolean, fromPicker?: boolean): this {
        const index = this.currentList.indexOf(value);

        if (index === -1) { return this; }

        this.value = value;

        if (!fromPicker) {
            this.selectListItem(index);
        }

        this.renderSelectedValue();

        return super.setValue(value, silent);
    }

    private createRowComponent(value: TValue): Component {
        const row = new RichSelectRow<TValue>(this.config, this.eWrapper);
        row.setParentComponent(this.listComponent!);

        this.getContext().createBean(row);
        row.setState(value);

        return row;
    }

    private getRowForMouseEvent(e: MouseEvent): number {
        const { listComponent } = this;

        if (!listComponent) { return  -1; }


        const eGui = listComponent?.getGui();
        const rect = eGui.getBoundingClientRect();
        const scrollTop = listComponent.getScrollTop();
        const mouseY = e.clientY - rect.top + scrollTop;

        return Math.floor(mouseY / listComponent.getRowHeight());
    }

    private onPickerMouseMove(e: MouseEvent): void {
        if (!this.listComponent) { return; }
        const row = this.getRowForMouseEvent(e);

        if (row !== -1) {
            this.selectListItem(row, true);
        }
    }

    private onNavigationKeyDown(event: any, key: string): void {
        // if we don't preventDefault the page body and/or grid scroll will move.
        event.preventDefault();

        const isDown = key === KeyCode.DOWN;

        if (!this.isPickerDisplayed && isDown) {
            this.showPicker();
            return;
        }

        const oldIndex = this.highlightedItem;

        const diff = isDown ? 1 : -1;
        const newIndex = oldIndex === - 1 ? 0 : oldIndex + diff;

        this.selectListItem(newIndex);
    }

    private onEnterKeyDown(e: KeyboardEvent): void {
        if (!this.isPickerDisplayed) { return; }
        e.preventDefault();

        this.onListValueSelected(this.currentList[this.highlightedItem], true);
    }

    private onListValueSelected(value: TValue, fromEnterKey: boolean): void {
        this.setValue(value, false, true);
        this.dispatchPickerEvent(value, fromEnterKey);
        this.hidePicker();
    }

    private dispatchPickerEvent(value: TValue, fromEnterKey: boolean): void {
        const event: WithoutGridCommon<FieldPickerValueSelectedEvent> = {
            type: Events.EVENT_FIELD_PICKER_VALUE_SELECTED,
            fromEnterKey,
            value
        };

        this.dispatchEvent(event);
    }

    public getFocusableElement(): HTMLElement {
        const { allowTyping } = this.config;

        if (allowTyping) {
            return this.eInput.getFocusableElement();
        }

        return super.getFocusableElement();
    }

    protected onKeyDown(event: KeyboardEvent): void {
        const key = event.key;

        const { allowTyping } = this.config;

        switch (key) {
            case KeyCode.LEFT:
            case KeyCode.RIGHT:
                if (!allowTyping) {
                    event.preventDefault();
                }
                break;
            case KeyCode.DOWN:
            case KeyCode.UP:
                this.onNavigationKeyDown(event, key);
                break;
            case KeyCode.ESCAPE:
                if (this.isPickerDisplayed) {
                    this.hidePicker();
                }
                break;
            case KeyCode.ENTER:
                this.onEnterKeyDown(event);
                break;
            default:
                if (!allowTyping) {
                    this.buildSearchStringFromKeyboardEvent(event);
                }
        }
    }

    public destroy(): void {
        if (this.listComponent) {
            this.destroyBean(this.listComponent);
            this.listComponent = undefined;
        }

        super.destroy();
    }

}