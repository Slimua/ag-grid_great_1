import { ChartMenuOptions, ColDef, CreateRangeChartParams, FirstDataRenderedEvent, Grid, GridOptions } from '@ag-grid-community/core';
import { getData } from "./data";


const columnDefs: ColDef[] = [
  { field: 'country', width: 150, chartDataType: 'category' },
  { field: 'gold', chartDataType: 'series' },
  { field: 'silver', chartDataType: 'series' },
  { field: 'bronze', chartDataType: 'series' },
  {
    headerName: 'A',
    valueGetter: 'Math.floor(Math.random()*1000)',
    chartDataType: 'series',
  },
  {
    headerName: 'B',
    valueGetter: 'Math.floor(Math.random()*1000)',
    chartDataType: 'series',
  },
  {
    headerName: 'C',
    valueGetter: 'Math.floor(Math.random()*1000)',
    chartDataType: 'series',
  },
  {
    headerName: 'D',
    valueGetter: 'Math.floor(Math.random()*1000)',
    chartDataType: 'series',
  },
]

const gridOptions: GridOptions = {
  defaultColDef: {
    editable: true,
    sortable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
    resizable: true,
  },
  columnDefs: columnDefs,
  rowData: getData(),
  popupParent: document.body,
  enableRangeSelection: true,
  onFirstDataRendered: onFirstDataRendered,
  enableCharts: true,
  enableChartsToolPanelButton: true
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
  var createRangeChartParams: CreateRangeChartParams = {
    cellRange: {
      rowStartIndex: 0,
      rowEndIndex: 5,
      columns: ['country', 'gold', 'silver', 'bronze'],
    },
    chartType: 'column',
  }

  params.api.createRangeChart(createRangeChartParams)
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  new Grid(gridDiv, gridOptions)
})
