import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component } from '@angular/core';

@Component({
    standalone: true,
    template: `
        @if (value) {
            <span> <i [class]="iconClass"> </i> {{ value }} </span>
        }
    `,
})
export class GenderCellRenderer implements ICellRendererAngularComp {
    public iconClass!: string;
    public value: any;

    agInit(params: ICellRendererParams): void {
        this.iconClass = params.value === 'Male' ? 'fa fa-male' : 'fa fa-female';
        this.value = params.value;
    }

    refresh(params: ICellRendererParams) {
        return false;
    }
}
