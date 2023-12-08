import { ICellEditor, ICellEditorParams } from "@ag-grid-community/core";
import { addOptionalMethods } from "./customComponent";
import { CellEditorMethods, CustomCellEditorParams } from "./interfaces";

export class CellEditorComponent implements ICellEditor {
    private value: any;

    constructor(private cellEditorParams: ICellEditorParams, private readonly refreshProps: () => void) {
        this.value = cellEditorParams.value;
    }

    public getProps(): CustomCellEditorParams {
        return {
            ...this.cellEditorParams,
            initialValue: this.cellEditorParams.value,
            value: this.value,
            onValueChange: value => this.updateValue(value)
        };
    }

    public getValue(): any {
        return this.value;
    }

    public onParamsUpdated(params: ICellEditorParams): void {
        this.cellEditorParams = params;
        this.refreshProps();
    }

    public setMethods(methods: CellEditorMethods): void {
        addOptionalMethods(this.getOptionalMethods(), methods, this);
    }

    private getOptionalMethods(): string[] {
        return ['isPopup', 'isCancelBeforeStart', 'isCancelAfterEnd', 'getPopupPosition', 'focusIn', 'focusOut', 'afterGuiAttached'];
    }

    private updateValue(value: any): void {
        this.value = value;
        this.refreshProps();
    }
}
