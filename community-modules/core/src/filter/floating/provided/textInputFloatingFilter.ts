import { KeyCode } from '../../../constants/keyCode';
import type { Bean } from '../../../context/bean';
import { BeanStub } from '../../../context/beanStub';
import type { FilterChangedEvent } from '../../../events';
import { _clearElement } from '../../../utils/dom';
import { _debounce } from '../../../utils/function';
import type { AgInputTextFieldParams } from '../../../widgets/agInputTextField';
import { AgInputTextField } from '../../../widgets/agInputTextField';
import { RefPlaceholder } from '../../../widgets/component';
import type { NumberFilter, NumberFilterModel } from '../../provided/number/numberFilter';
import { ProvidedFilter } from '../../provided/providedFilter';
import type { TextFilterModel, TextFilterParams } from '../../provided/text/textFilter';
import { TextFilter } from '../../provided/text/textFilter';
import type { IFloatingFilterParams } from '../floatingFilter';
import { SimpleFloatingFilter } from './simpleFloatingFilter';

export interface FloatingFilterInputService extends Bean {
    setupGui(parentElement: HTMLElement): void;
    setEditable(editable: boolean): void;
    getValue(): string | null | undefined;
    setValue(value: string | null | undefined, silent?: boolean): void;
    setValueChangedListener(listener: (e: KeyboardEvent) => void): void;
    setParams(params: { ariaLabel: string; autoComplete?: boolean | string }): void;
}

export class FloatingFilterTextInputService extends BeanStub implements FloatingFilterInputService {
    private eFloatingFilterTextInput: AgInputTextField = RefPlaceholder;
    private valueChangedListener: (e: KeyboardEvent) => void = () => {};

    constructor(private params?: { config?: AgInputTextFieldParams }) {
        super();
    }

    public setupGui(parentElement: HTMLElement): void {
        this.eFloatingFilterTextInput = this.createManagedBean(new AgInputTextField(this.params?.config));

        const eInput = this.eFloatingFilterTextInput.getGui();

        parentElement.appendChild(eInput);

        this.addManagedListener(eInput, 'input', (e: KeyboardEvent) => this.valueChangedListener(e));
        this.addManagedListener(eInput, 'keydown', (e: KeyboardEvent) => this.valueChangedListener(e));
    }

    public setEditable(editable: boolean): void {
        this.eFloatingFilterTextInput.setDisabled(!editable);
    }

    public setAutoComplete(autoComplete: boolean | string): void {
        this.eFloatingFilterTextInput.setAutoComplete(autoComplete);
    }

    public getValue(): string | null | undefined {
        return this.eFloatingFilterTextInput.getValue();
    }

    public setValue(value: string | null | undefined, silent?: boolean): void {
        this.eFloatingFilterTextInput.setValue(value, silent);
    }

    public setValueChangedListener(listener: (e: KeyboardEvent) => void): void {
        this.valueChangedListener = listener;
    }

    public setParams(params: { ariaLabel: string; autoComplete?: boolean | string }): void {
        this.setAriaLabel(params.ariaLabel);

        if (params.autoComplete !== undefined) {
            this.setAutoComplete(params.autoComplete);
        }
    }

    private setAriaLabel(ariaLabel: string): void {
        this.eFloatingFilterTextInput.setInputAriaLabel(ariaLabel);
    }
}

export interface ITextInputFloatingFilterParams extends IFloatingFilterParams<TextFilter | NumberFilter> {
    /**
     * Overrides the browser's autocomplete/autofill behaviour by updating the autocomplete attribute on the input field used in the floating filter input.
     * Possible values are:
     * - `true` to allow the **default** browser autocomplete/autofill behaviour.
     * - `false` to disable the browser autocomplete/autofill behavior by setting the `autocomplete` attribute to `off`.
     * - A **string** to be used as the [autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) attribute value.
     * Some browsers do not respect setting the HTML attribute `autocomplete="off"` and display the auto-fill prompts anyway.
     * @default false
     */
    browserAutoComplete?: boolean | string;
}

type ModelUnion = TextFilterModel | NumberFilterModel;
export abstract class TextInputFloatingFilter<M extends ModelUnion> extends SimpleFloatingFilter {
    private readonly eFloatingFilterInputContainer: HTMLElement = RefPlaceholder;
    private floatingFilterInputService: FloatingFilterInputService;

    protected params: ITextInputFloatingFilterParams;

    private applyActive: boolean;

    protected abstract createFloatingFilterInputService(
        params: ITextInputFloatingFilterParams
    ): FloatingFilterInputService;

    public postConstruct(): void {
        this.setTemplate(/* html */ `
            <div class="ag-floating-filter-input" role="presentation" data-ref="eFloatingFilterInputContainer"></div>
        `);
    }

    protected getDefaultDebounceMs(): number {
        return 500;
    }

    public onParentModelChanged(model: M, event: FilterChangedEvent): void {
        if (this.isEventFromFloatingFilter(event) || this.isEventFromDataChange(event)) {
            // if the floating filter triggered the change, it is already in sync.
            // Data changes also do not affect provided text floating filters
            return;
        }

        this.setLastTypeFromModel(model);
        this.setEditable(this.canWeEditAfterModelFromParentFilter(model));
        this.floatingFilterInputService.setValue(this.getFilterModelFormatter().getModelAsString(model));
    }

    public init(params: ITextInputFloatingFilterParams): void {
        this.setupFloatingFilterInputService(params);
        super.init(params);
        this.setTextInputParams(params);
    }

    private setupFloatingFilterInputService(params: ITextInputFloatingFilterParams): void {
        this.floatingFilterInputService = this.createFloatingFilterInputService(params);
        this.floatingFilterInputService.setupGui(this.eFloatingFilterInputContainer);
    }

    private setTextInputParams(params: ITextInputFloatingFilterParams): void {
        this.params = params;

        const autoComplete = params.browserAutoComplete ?? false;
        this.floatingFilterInputService.setParams({
            ariaLabel: this.getAriaLabel(params),
            autoComplete,
        });

        this.applyActive = ProvidedFilter.isUseApplyButton(this.params.filterParams);

        if (!this.isReadOnly()) {
            const debounceMs = ProvidedFilter.getDebounceMs(this.params.filterParams, this.getDefaultDebounceMs());
            const toDebounce: (e: KeyboardEvent) => void = _debounce(
                this.syncUpWithParentFilter.bind(this),
                debounceMs
            );

            this.floatingFilterInputService.setValueChangedListener(toDebounce);
        }
    }

    public onParamsUpdated(params: ITextInputFloatingFilterParams): void {
        this.refresh(params);
    }

    public refresh(params: ITextInputFloatingFilterParams): void {
        super.refresh(params);
        this.setTextInputParams(params);
    }

    protected recreateFloatingFilterInputService(params: ITextInputFloatingFilterParams): void {
        const value = this.floatingFilterInputService.getValue();
        _clearElement(this.eFloatingFilterInputContainer);
        this.destroyBean(this.floatingFilterInputService);
        this.setupFloatingFilterInputService(params);
        this.floatingFilterInputService.setValue(value, true);
    }

    private syncUpWithParentFilter(e: KeyboardEvent): void {
        const isEnterKey = e.key === KeyCode.ENTER;

        if (this.applyActive && !isEnterKey) {
            return;
        }

        let value = this.floatingFilterInputService.getValue();

        if ((this.params.filterParams as TextFilterParams).trimInput) {
            value = TextFilter.trimInput(value);
            this.floatingFilterInputService.setValue(value, true); // ensure visible value is trimmed
        }

        this.params.parentFilterInstance((filterInstance) => {
            if (filterInstance) {
                // NumberFilter is typed as number, but actually receives string values
                filterInstance.onFloatingFilterChanged(this.getLastType() || null, (value as never) || null);
            }
        });
    }

    protected setEditable(editable: boolean): void {
        this.floatingFilterInputService.setEditable(editable);
    }
}
