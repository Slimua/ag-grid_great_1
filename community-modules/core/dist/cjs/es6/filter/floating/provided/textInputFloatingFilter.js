/**
 * @ag-grid-community/core - Advanced Data Grid / Data Table supporting Javascript / Typescript / React / Angular / Vue
 * @version v29.1.0
 * @link https://www.ag-grid.com/
 * @license MIT
 */
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextInputFloatingFilter = void 0;
const componentAnnotations_1 = require("../../../widgets/componentAnnotations");
const function_1 = require("../../../utils/function");
const providedFilter_1 = require("../../provided/providedFilter");
const context_1 = require("../../../context/context");
const simpleFloatingFilter_1 = require("./simpleFloatingFilter");
const keyCode_1 = require("../../../constants/keyCode");
const textFilter_1 = require("../../provided/text/textFilter");
class TextInputFloatingFilter extends simpleFloatingFilter_1.SimpleFloatingFilter {
    postConstruct() {
        this.resetTemplate();
    }
    resetTemplate(paramsMap) {
        this.setTemplate(/* html */ `
            <div class="ag-floating-filter-input" role="presentation">
                <ag-input-text-field ref="eFloatingFilterInput"></ag-input-text-field>
            </div>
        `, paramsMap);
    }
    getDefaultDebounceMs() {
        return 500;
    }
    onParentModelChanged(model, event) {
        if (this.isEventFromFloatingFilter(event) || this.isEventFromDataChange(event)) {
            // if the floating filter triggered the change, it is already in sync.
            // Data changes also do not affect provided text floating filters
            return;
        }
        this.setLastTypeFromModel(model);
        this.eFloatingFilterInput.setValue(this.getFilterModelFormatter().getModelAsString(model));
        this.setEditable(this.canWeEditAfterModelFromParentFilter(model));
    }
    init(params) {
        super.init(params);
        this.params = params;
        this.applyActive = providedFilter_1.ProvidedFilter.isUseApplyButton(this.params.filterParams);
        const { allowedCharPattern } = this.params.filterParams;
        if (allowedCharPattern != null) {
            this.resetTemplate({ eFloatingFilterInput: { allowedCharPattern } });
        }
        if (!this.isReadOnly()) {
            const debounceMs = providedFilter_1.ProvidedFilter.getDebounceMs(this.params.filterParams, this.getDefaultDebounceMs());
            const toDebounce = function_1.debounce(this.syncUpWithParentFilter.bind(this), debounceMs);
            const filterGui = this.eFloatingFilterInput.getGui();
            this.addManagedListener(filterGui, 'input', toDebounce);
            this.addManagedListener(filterGui, 'keypress', toDebounce);
            this.addManagedListener(filterGui, 'keydown', toDebounce);
        }
        const columnDef = params.column.getDefinition();
        if (this.isReadOnly() || (columnDef.filterParams &&
            columnDef.filterParams.filterOptions &&
            columnDef.filterParams.filterOptions.length === 1 &&
            columnDef.filterParams.filterOptions[0] === 'inRange')) {
            this.eFloatingFilterInput.setDisabled(true);
        }
        const displayName = this.columnModel.getDisplayNameForColumn(params.column, 'header', true);
        const translate = this.localeService.getLocaleTextFunc();
        this.eFloatingFilterInput.setInputAriaLabel(`${displayName} ${translate('ariaFilterInput', 'Filter Input')}`);
    }
    syncUpWithParentFilter(e) {
        const enterKeyPressed = e.key === keyCode_1.KeyCode.ENTER;
        if (this.applyActive && !enterKeyPressed) {
            return;
        }
        let value = this.eFloatingFilterInput.getValue();
        if (this.params.filterParams.trimInput) {
            value = textFilter_1.TextFilter.trimInput(value);
            this.eFloatingFilterInput.setValue(value, true); // ensure visible value is trimmed
        }
        this.params.parentFilterInstance(filterInstance => {
            if (filterInstance) {
                // NumberFilter is typed as number, but actually receives string values
                filterInstance.onFloatingFilterChanged(this.getLastType() || null, value || null);
            }
        });
    }
    setEditable(editable) {
        this.eFloatingFilterInput.setDisabled(!editable);
    }
}
__decorate([
    context_1.Autowired('columnModel')
], TextInputFloatingFilter.prototype, "columnModel", void 0);
__decorate([
    componentAnnotations_1.RefSelector('eFloatingFilterInput')
], TextInputFloatingFilter.prototype, "eFloatingFilterInput", void 0);
__decorate([
    context_1.PostConstruct
], TextInputFloatingFilter.prototype, "postConstruct", null);
exports.TextInputFloatingFilter = TextInputFloatingFilter;
