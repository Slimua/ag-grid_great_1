import Vue from 'vue';
import {AgGridVue} from '@ag-grid-community/vue';
import '@ag-grid-community/styles/ag-grid.css';
import "@ag-grid-community/styles/ag-theme-alpine.css";
import './styles.css';
import {ModuleRegistry} from '@ag-grid-community/core';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule])

const VueExample = {
    template: `
        <div style="height: 100%">
            <div class="test-container">
                <div class="test-header">
                    <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
                        <div><span style="font-weight: bold;">Athlete Description</span> column width:</div>
                        <div style="padding-left: 1em">- On gridReady event: <span style="font-weight: bold">{{athleteDescriptionColWidthOnReady}}</span></div>
                        <div style="padding-left: 1em">- On firstDataRendered event: <span style="font-weight: bold">{{athleteDescriptionColWidthOnFirstDataRendered}}</span></div>
                    </div>
                    <button v-if="isLoadDataButtonVisible" v-on:click="loadGridData()" style="margin-bottom: 1rem;">Load Grid Data</button>
                </div>
                <ag-grid-vue
                    style="width: 100%; height: 100%;"
                    class="ag-theme-alpine"
                    :columnDefs="columnDefs"
                    @grid-ready="onGridReady"
                    :defaultColDef="defaultColDef"
                    :suppressLoadingOverlay="true"
                    @first-data-rendered="onFirstDataRendered"></ag-grid-vue>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            columnDefs: [{
                field: "athleteDescription",
                valueGetter: (params) => {
                    const {data} = params;
                    const {person} = data;
                    return `The ${person.age} years old ${data.name} from ${person.country}`;
                }
            }, {
                field: "medals.gold",
                headerName: "Gold Medals"
            }, {
                field: "person.age",
                headerName: "Age"
            }],
            gridApi: null,
            columnApi: null,
            athleteDescriptionColWidthOnReady: '-',
            athleteDescriptionColWidthOnFirstDataRendered: '-',
            isLoadDataButtonVisible: true,
            defaultColDef: {
                minWidth: 150,
            },

        }
    },
    created() {
    },
    methods: {
        onFirstDataRendered(params) {
            const {columnApi} = params;
            const column = columnApi.getColumn('athleteDescription');
            if (column) {
                columnApi.autoSizeColumns([column.getId()]);
                this.athleteDescriptionColWidthOnFirstDataRendered = `${column.getActualWidth()}px`;
            }

            console.warn('AG Grid: onFirstDataRendered event triggered');
        },
        loadGridData() {
            this.gridApi.setRowData(getData());
            this.isLoadDataButtonVisible = false;
        },
        onGridReady(params) {
            this.gridApi = params.api;
            this.gridColumnApi = params.columnApi;

            const column = this.gridColumnApi.getColumn('athleteDescription');
            if (column) {
                this.gridColumnApi.autoSizeColumns([column.getId()]);
                this.athleteDescriptionColWidthOnReady = `${column.getActualWidth()}px`;
            }

            console.warn('AG Grid: onGridReady event triggered');
        },
    }
}

new Vue({
    el: '#app',
    components: {
        'my-component': VueExample
    }
});
