import { AgComponentSelector, AgInputTextField, Autowired, RefPlaceholder } from '@ag-grid-community/core';
import { _Util } from 'ag-charts-community';

import { ChartTranslationService } from '../charts/chartComp/services/chartTranslationService';

export class AgColorInput extends AgInputTextField {
    static readonly selector: AgComponentSelector = 'AG-COLOR-INPUT';
    private static TEMPLATE = /* html */ `
        <div role="presentation" class="ag-color-input">
            <div data-ref="eLabel" class="ag-input-field-label"></div>
            <div data-ref="eWrapper" class="ag-wrapper ag-input-wrapper" role="presentation">
                <input data-ref="eInput" class="ag-input-field-input">
                <div data-ref="eColor" class="ag-color-input-color"></div>
            </div>
        </div>`;

    @Autowired('chartTranslationService') private readonly chartTranslationService: ChartTranslationService;
    private readonly eColor: HTMLElement = RefPlaceholder;

    constructor() {
        super({ template: AgColorInput.TEMPLATE });
    }

    public setColor(color: _Util.Color): void {
        const rgbaColor = color.toRgbaString();
        this.setValue(_Util.Color.fromString(rgbaColor).toHexString().toUpperCase(), true);
        this.eColor.style.backgroundColor = rgbaColor;
    }

    public setValue(value?: string | null | undefined, silent?: boolean | undefined): this {
        const isValid = _Util.Color.validColorString(value ?? '');
        this.eInput.setCustomValidity(isValid ? '' : this.chartTranslationService.translate('invalidColor'));
        super.setValue(value, silent);
        if (isValid && !silent) {
            this.dispatchEvent({ type: 'colorChanged' });
        }
        return this;
    }

    public onColorChanged(callback: (color: _Util.Color) => void): void {
        this.addManagedListener(this, 'colorChanged', () => callback(_Util.Color.fromString(this.value!)));
    }
}
