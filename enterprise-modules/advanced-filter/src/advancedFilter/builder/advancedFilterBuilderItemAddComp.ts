import type { BeanCollection, FieldPickerValueSelectedEvent } from '@ag-grid-community/core';
import {
    Component,
    Events,
    RefPlaceholder,
    TooltipFeature,
    _setAriaLabel,
    _setAriaLevel,
} from '@ag-grid-community/core';

import type { AdvancedFilterExpressionService } from '../advancedFilterExpressionService';
import { AddDropdownComp } from './addDropdownComp';
import { AdvancedFilterBuilderItemNavigationFeature } from './advancedFilterBuilderItemNavigationFeature';
import { getAdvancedFilterBuilderAddButtonParams } from './advancedFilterBuilderUtils';
import type { AdvancedFilterBuilderAddEvent, AdvancedFilterBuilderItem } from './iAdvancedFilterBuilder';
import { AdvancedFilterBuilderEvents } from './iAdvancedFilterBuilder';

export class AdvancedFilterBuilderItemAddComp extends Component {
    private advancedFilterExpressionService: AdvancedFilterExpressionService;

    public override wireBeans(beans: BeanCollection) {
        super.wireBeans(beans);
        this.advancedFilterExpressionService = beans.advancedFilterExpressionService;
    }

    private readonly eItem: HTMLElement = RefPlaceholder;

    constructor(
        private readonly item: AdvancedFilterBuilderItem,
        private readonly focusWrapper: HTMLElement
    ) {
        super(/* html */ `
            <div class="ag-advanced-filter-builder-item-wrapper" role="presentation">
                <div data-ref="eItem" class="ag-advanced-filter-builder-item" role="presentation">
                    <div class="ag-advanced-filter-builder-item-tree-lines" aria-hidden="true">
                        <div class="ag-advanced-filter-builder-item-tree-line-vertical-top ag-advanced-filter-builder-item-tree-line-horizontal"></div>
                    </div>
                </div>
            </div>
        `);
    }

    public postConstruct(): void {
        _setAriaLevel(this.focusWrapper, 2);

        const addButtonParams = getAdvancedFilterBuilderAddButtonParams(
            (key) => this.advancedFilterExpressionService.translate(key),
            this.gos.get('advancedFilterBuilderParams')?.addSelectWidth
        );
        const eAddButton = this.createManagedBean(new AddDropdownComp(addButtonParams));
        this.addManagedListener(
            eAddButton,
            Events.EVENT_FIELD_PICKER_VALUE_SELECTED,
            ({ value }: FieldPickerValueSelectedEvent) => {
                this.dispatchEvent<AdvancedFilterBuilderAddEvent>({
                    type: AdvancedFilterBuilderEvents.EVENT_ADDED,
                    item: this.item,
                    isJoin: value.key === 'join',
                });
            }
        );
        this.eItem.appendChild(eAddButton.getGui());

        this.createManagedBean(
            new TooltipFeature({
                getGui: () => eAddButton.getGui(),
                getLocation: () => 'advancedFilter',
                getTooltipValue: () =>
                    this.advancedFilterExpressionService.translate('advancedFilterBuilderAddButtonTooltip'),
            })
        );

        this.createManagedBean(
            new AdvancedFilterBuilderItemNavigationFeature(this.getGui(), this.focusWrapper, eAddButton)
        );

        _setAriaLabel(
            this.focusWrapper,
            this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderItem', [
                this.advancedFilterExpressionService.translate('advancedFilterBuilderAddButtonTooltip'),
                `${this.item.level + 1}`,
            ])
        );
    }

    public afterAdd(): void {
        // do nothing
    }
}
