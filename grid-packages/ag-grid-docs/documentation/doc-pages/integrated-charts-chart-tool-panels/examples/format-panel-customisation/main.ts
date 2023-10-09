import {
  ColDef,
  CreateRangeChartParams,
  FirstDataRenderedEvent,
  GridApi,
  createGrid,
  GridOptions,
} from '@ag-grid-community/core';
import { getData } from "./data";

const columnDefs: ColDef[] = [
  { field: 'country', width: 150, chartDataType: 'category' },
  { field: 'gold', chartDataType: 'series' },
  { field: 'silver', chartDataType: 'series' },
  { field: 'bronze', chartDataType: 'series' },
]

let api: GridApi;

const gridOptions: GridOptions = {
  defaultColDef: {
    flex: 1,
  },
  columnDefs: columnDefs,
  rowData: getData(),
  onFirstDataRendered: onFirstDataRendered,
  popupParent: document.body,
  enableRangeSelection: true,
  enableCharts: true,
  chartToolPanelsDef: {
    defaultToolPanel: 'format',
    formatPanel: {
      groups: [
        { type: 'series' },
        { type: 'chart' },
        { type: 'legend' },
        { type: 'axis', isOpen: true }
      ]
    }
  }
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
  const createRangeChartParams: CreateRangeChartParams = {
    cellRange: {
      rowStartIndex: 0,
      rowEndIndex: 4,
      columns: ['country', 'gold', 'silver', 'bronze'],
    },
    chartType: 'groupedColumn',
  }

  params.api.createRangeChart(createRangeChartParams)
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  api = createGrid(gridDiv, gridOptions);;
})
