import { Component, ViewChild } from '@angular/core';
import {
    ComponentFixture,
    TestBed
} from '@angular/core/testing';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { GridApi, GridOptions, GridReadyEvent, Module } from '@ag-grid-community/core';
import { AgGridAngular } from './ag-grid-angular.component';

@Component({
    selector: 'app-grid-wrapper',
    standalone: true,
    imports: [AgGridAngular],
    template: `<ag-grid-angular
        [gridOptions]="gridOptions"
        [columnDefs]="columnDefs"
        [rowData]="rowData"
        [modules]="modules"
        (gridReady)="onGridReady($event)"
        (firstDataRendered)="onFirstDataRendered($event)"></ag-grid-angular>`,
})
export class GridWrapperComponent {
    modules: Module[] = [ClientSideRowModelModule];
    rowData: any[] | null = null;
    columnDefs = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

    gridOptions: GridOptions = {};
    gridApi: GridApi;

    @ViewChild(AgGridAngular) agGrid: AgGridAngular;

    onGridReady(params: GridReadyEvent) {
        this.gridApi = params.api;
        // this.gridApi.setGridOption('rowData', [{ make: 'Toyota', model: 'Celica', price: 35000 }]);
        this.rowData = [{ make: 'Toyota', model: 'Celica', price: 35000 }];
    }
    onFirstDataRendered(params: any) {}
}

describe('Grid OnReady', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
    let component: GridWrapperComponent;
    let fixture: ComponentFixture<GridWrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridWrapperComponent, AgGridAngular],
        }).compileComponents();
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(GridWrapperComponent);
        component = fixture.componentInstance;
    });

    it('should run in / out Angular Zone', (done) => {
        fixture.detectChanges();
        setTimeout(() => {
            expect(component.gridApi).toBeDefined();
            done();
        }, 0);
    });

    it('Grid Ready run', async () => {
        spyOn(component, 'onGridReady').and.callThrough();
        spyOn(component, 'onFirstDataRendered').and.callThrough();

        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.gridApi).toBeDefined();

        fixture.detectChanges(); // force rowData binding to be applied
        await fixture.whenStable();

        // If calling the gridApi.setRowData we don't need to call the fixture.detectChanges()

        expect(component.onGridReady).toHaveBeenCalled();
        expect(component.onFirstDataRendered).toHaveBeenCalled();
    });

    it('Grid Ready run Auto', async () => {
        spyOn(component, 'onGridReady').and.callThrough();
        spyOn(component, 'onFirstDataRendered').and.callThrough();
        fixture.autoDetectChanges();
        await fixture.whenStable();

        expect(component.gridApi).toBeDefined();

        expect(component.onGridReady).toHaveBeenCalled();
        expect(component.onFirstDataRendered).toHaveBeenCalled();
    });
});
