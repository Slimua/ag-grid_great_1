import { AgCheckbox } from '../widgets/agCheckbox';
import { Autowired, PostConstruct } from '../context/context';
import { Column } from '../entities/column';
import { Component } from '../widgets/component';
import { Events } from '../events';
import { GridOptionsWrapper } from '../gridOptionsWrapper';
import { IsRowSelectable } from '../entities/gridOptions';
import { RefSelector } from '../widgets/componentAnnotations';
import { RowNode } from '../entities/rowNode';
import { stopPropagationForAgGrid } from '../utils/event';

export class CheckboxSelectionComponent extends Component {

    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;

    @RefSelector('eCheckbox') private eCheckbox: AgCheckbox;

    private rowNode: RowNode;
    private column: Column;
    private isRowSelectableFunc: IsRowSelectable;

    constructor() {
        super(/* html*/`
            <div class="ag-selection-checkbox">
                <ag-checkbox role="presentation" ref="eCheckbox"></ag-checkbox>
            </div>`
        );
    }

    @PostConstruct
    private postConstruct(): void {
        this.eCheckbox.setPassive(true);
    }

    private onDataChanged(): void {
        // when rows are loaded for the second time, this can impact the selection, as a row
        // could be loaded as already selected (if user scrolls down, and then up again).
        this.onSelectionChanged();
    }

    private onSelectableChanged(): void {
        this.showOrHideSelect();
    }

    private onSelectionChanged(): void {
        const state = this.rowNode.isSelected();
        const stateName = state === undefined ? 'indeterminate' : (state === true ? 'checked' : 'unchecked');

        this.eCheckbox.setValue(state, true);
        this.eCheckbox.setInputAriaLabel(`Press Space to toggle row selection (${stateName})`);
    }

    private onCheckedClicked(): number {
        const groupSelectsFiltered = this.gridOptionsWrapper.isGroupSelectsFiltered();
        const updatedCount = this.rowNode.setSelectedParams({ newValue: false, groupSelectsFiltered: groupSelectsFiltered });
        return updatedCount;
    }

    private onUncheckedClicked(event: MouseEvent): number {
        const groupSelectsFiltered = this.gridOptionsWrapper.isGroupSelectsFiltered();
        const updatedCount = this.rowNode.setSelectedParams({ newValue: true, rangeSelect: event.shiftKey, groupSelectsFiltered: groupSelectsFiltered });
        return updatedCount;
    }

    public init(params: any): void {
        this.rowNode = params.rowNode;
        this.column = params.column;

        this.onSelectionChanged();

        // we don't want the row clicked event to fire when selecting the checkbox, otherwise the row
        // would possibly get selected twice
        this.addGuiEventListener('click', event => stopPropagationForAgGrid(event));
        // likewise we don't want double click on this icon to open a group
        this.addGuiEventListener('dblclick', event => stopPropagationForAgGrid(event));

        this.addManagedListener(this.eCheckbox.getInputElement(), 'click', (clickParams) => {
            if (clickParams.previousValue === undefined) { // indeterminate
                const result = this.onUncheckedClicked(clickParams.event || {});
                if (result === 0) {
                    this.onCheckedClicked();
                }
            } else if (clickParams.selected) {
                this.onUncheckedClicked(clickParams.event || {});
            } else {
                this.onCheckedClicked();
            }
        });

        this.addManagedListener(this.rowNode, RowNode.EVENT_ROW_SELECTED, this.onSelectionChanged.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_DATA_CHANGED, this.onDataChanged.bind(this));
        this.addManagedListener(this.rowNode, RowNode.EVENT_SELECTABLE_CHANGED, this.onSelectableChanged.bind(this));

        this.isRowSelectableFunc = this.gridOptionsWrapper.getIsRowSelectableFunc()!;
        const checkboxVisibleIsDynamic = this.isRowSelectableFunc || this.checkboxCallbackExists();
        if (checkboxVisibleIsDynamic) {
            this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.showOrHideSelect.bind(this));
            this.showOrHideSelect();
        }

        this.eCheckbox.getInputElement().setAttribute('tabindex', '-1');
    }

    private showOrHideSelect(): void {
        // if the isRowSelectable() is not provided the row node is selectable by default
        let selectable = this.rowNode.selectable;

        // checkboxSelection callback is deemed a legacy solution however we will still consider it's result.
        // If selectable, then also check the colDef callback. if not selectable, this it short circuits - no need
        // to call the colDef callback.
        if (selectable && this.checkboxCallbackExists()) {
            selectable = this.column.isCellCheckboxSelection(this.rowNode);
        }

        // show checkbox if both conditions are true
        this.setDisplayed(selectable);
    }

    private checkboxCallbackExists(): boolean {
        // column will be missing if groupUseEntireRow=true
        const colDef = this.column ? this.column.getColDef() : null;
        return !!colDef && typeof colDef.checkboxSelection === 'function';
    }
}
