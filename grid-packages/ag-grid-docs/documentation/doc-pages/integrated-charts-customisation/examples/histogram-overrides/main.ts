import {createGrid, FirstDataRenderedEvent, GridApi, GridOptions, GridReadyEvent} from '@ag-grid-community/core';
import {getData} from "./data";

let gridApi: GridApi;

const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'country', width: 150, chartDataType: 'category' },
    { field: 'gold', chartDataType: 'series' },
    { field: 'silver', chartDataType: 'series' },
    { field: 'bronze', chartDataType: 'series' },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 100,
  },
  popupParent: document.body,
  enableRangeSelection: true,
  enableCharts: true,
  chartThemeOverrides: {
    histogram: {
    series: {
        // @ts-ignore charts typing
        bins: [
          [0, 10],
          [10, 40],
          [40, 80],
          [80, 100],
        ],
        fillOpacity: 0.8,
        strokeOpacity: 0.8,
        strokeWidth: 4,
        shadow: {
          enabled: true,
          color: 'rgba(0, 0, 0, 0.3)',
          xOffset: 10,
          yOffset: 10,
          blur: 8,
        },
        label: {
          enabled: true,
          fontStyle: 'italic',
          fontWeight: 'bold',
          fontSize: 15,
          fontFamily: 'Arial, sans-serif',
          color: 'white',
          formatter: (params:any) => { // charts typings
            return '<' + params.value + '>'
          },
        },
        highlightStyle: {
          item: {
            fill: 'black',
            stroke: 'yellow',
          },
        },
        tooltip: {
          renderer: (params:any) => { // charts typings
            var bin = params.datum
            var binSize = bin.frequency
            var medalColour = params.xKey

            return {
              content:
                binSize +
                (binSize >= 2 ? ' countries' : ' country') +
                ' got between ' +
                  // @ts-ignore charts typing
                params.xValue[0] +
                ' and ' +
                  // @ts-ignore charts typing
                params.xValue[1] +
                ' ' +
                medalColour +
                ' medals',
            }
          },
        },
      },
    },
  },
  onGridReady : (params: GridReadyEvent) => {
    getData().then(rowData => params.api.setGridOption('rowData', rowData));
  },
  onFirstDataRendered,
};



function onFirstDataRendered(params: FirstDataRenderedEvent) {
  params.api.createRangeChart({
    cellRange: {
      rowStartIndex: 0,
      rowEndIndex: 20,
      columns: ['bronze'],
    },
    chartType: 'histogram',
  });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);
})


























