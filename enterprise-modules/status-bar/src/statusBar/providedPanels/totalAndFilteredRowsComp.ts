import {
    Autowired,
    Events,
    GridApi,
    IStatusPanelComp,
    PostConstruct,
    getLocaleTextFunc,
    _
} from '@ag-grid-community/core';
import { NameValueComp } from "./nameValueComp";

export class TotalAndFilteredRowsComp extends NameValueComp implements IStatusPanelComp {

    @Autowired('gridApi') private gridApi: GridApi;

    @PostConstruct
    protected postConstruct(): void {
        // this component is only really useful with client side row model
        if (this.gridApi.getModel().getType() !== 'clientSide') {
            console.warn(`AG Grid: agTotalAndFilteredRowCountComponent should only be used with the client side row model.`);
            return;
        }

        this.setLabel('totalAndFilteredRows', 'Rows');

        this.addCssClass('ag-status-panel');
        this.addCssClass('ag-status-panel-total-and-filtered-row-count');

        this.setDisplayed(true);

        this.addManagedListener(this.eventService, Events.EVENT_MODEL_UPDATED, this.onDataChanged.bind(this));
        this.onDataChanged();
    }

    private onDataChanged() {
        const localeTextFunc = getLocaleTextFunc(this.gridOptionsService);
        const thousandSeparator = localeTextFunc('thousandSeparator', ',');
        const decimalSeparator = localeTextFunc('decimalSeparator', '.');

        const rowCount = _.formatNumberCommas(this.getFilteredRowCountValue(), thousandSeparator, decimalSeparator);
        const totalRowCount = _.formatNumberCommas(this.getTotalRowCount(), thousandSeparator, decimalSeparator);

        if (rowCount === totalRowCount) {
            this.setValue(rowCount);
        } else {
            const localeTextFunc = getLocaleTextFunc(this.gridOptionsService);
            this.setValue(`${rowCount} ${localeTextFunc('of', 'of')} ${totalRowCount}`);
        }
    }

    private getFilteredRowCountValue(): number {
        let filteredRowCount = 0;
        this.gridApi.forEachNodeAfterFilter((node) => {
            if (!node.group) { filteredRowCount++; }
        });
        return filteredRowCount;
    }

    private getTotalRowCount(): number {
        let totalRowCount = 0;
        this.gridApi.forEachNode(node => {
            if (!node.group) { totalRowCount++; }
        });
        return totalRowCount;
    }

    public init() {}

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public destroy(): void {
        super.destroy();
    }

}
