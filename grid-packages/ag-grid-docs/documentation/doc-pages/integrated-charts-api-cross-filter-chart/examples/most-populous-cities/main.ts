import { FirstDataRenderedEvent, GridApi, createGrid, GridApi, GridOptions } from '@ag-grid-community/core';
import { getData } from "./data";


let api: GridApi;


const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'city', chartDataType: 'category' },
    { field: 'country', chartDataType: 'category' },
    { field: 'longitude', chartDataType: 'series' },
    { field: 'latitude', chartDataType: 'series' },
    { field: 'population', chartDataType: 'series' },
  ],
  defaultColDef: {
    flex: 1,
    editable: true,
    sortable: true,
    filter: 'agMultiColumnFilter',
    floatingFilter: true,
    resizable: true,
  },
  rowData: getData(),
  enableCharts: true,
  chartThemes: ['ag-default-dark'],
  onFirstDataRendered: onFirstDataRendered,
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
  createColumnChart(params.api)
  createBubbleChart(params.api)
}

function createColumnChart(gridApi: GridApi) {
  gridApi.createCrossFilterChart({
    chartType: 'column',
    cellRange: {
      columns: ['country', 'population'],
    },
    aggFunc: 'count',
    chartThemeOverrides: {
      common: {
        title: {
          enabled: true,
          text: 'Number of Most Populous Cities by Country',
        },
        legend: {
          enabled: false,
        },
      },
      cartesian: {
        axes: {
          category: {
            label: {
              rotation: 325,
            },
          },
        },
      },
    },
    chartContainer: document.querySelector('#barChart') as any,
  })
}

function createBubbleChart(gridApi: GridApi) {
  gridApi.createCrossFilterChart({
    chartType: 'bubble',
    cellRange: {
      columns: ['longitude', 'latitude', 'population'],
    },
    chartThemeOverrides: {
      common: {
        title: {
          enabled: true,
          text: 'Latitude vs Longitude of Most Populous Cities',
        },
        legend: {
          enabled: false,
        },
      },
    },
    chartContainer: document.querySelector('#bubbleChart') as any,
  })
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  api = createGrid(gridDiv, gridOptions);;
})
