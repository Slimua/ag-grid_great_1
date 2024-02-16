import {createGrid, FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent, ChartRef, ChartType} from '@ag-grid-community/core';
import {getData} from "./data";

let gridApi: GridApi;
let chartRef: ChartRef | undefined;

const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'period', chartDataType: 'category', headerName: 'Financial Period', width: 150 },
    { field: 'recurring', chartDataType: 'series', headerName: 'Recurring revenue' },
    { field: 'individual', chartDataType: 'series', headerName: 'Individual sales' },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 100,
  },
  popupParent: document.body,
  enableRangeSelection: true,
  enableCharts: true,
  chartToolPanelsDef: {
    defaultToolPanel: 'settings'
  },
  onGridReady : (params: GridReadyEvent) => {
    getData().then(rowData => params.api.setGridOption('rowData', rowData));
  },
  onFirstDataRendered,
};

function onFirstDataRendered(params: FirstDataRenderedEvent) {
  chartRef = params.api.createRangeChart({
    cellRange: {
      columns: ['period', 'recurring', 'individual'],
    },
    chartType: 'groupedColumn',
  });
}

function updateChart(chartType: ChartType) {
  gridApi.updateChart({
    type: 'rangeChartUpdate',
    chartId: `${chartRef?.chartId}`,
    chartType: chartType
  });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);
})
