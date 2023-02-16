import { Component, IFloatingFilter, IFloatingFilterParams, SetFilterModel } from '@ag-grid-community/core';
export declare class SetFloatingFilterComp<V = string> extends Component implements IFloatingFilter {
    private readonly eFloatingFilterText;
    private readonly columnModel;
    private params;
    private availableValuesListenerAdded;
    private readonly filterModelFormatter;
    constructor();
    destroy(): void;
    init(params: IFloatingFilterParams): void;
    onParentModelChanged(parentModel: SetFilterModel): void;
    private parentSetFilterInstance;
    private addAvailableValuesListener;
    private updateFloatingFilterText;
}
