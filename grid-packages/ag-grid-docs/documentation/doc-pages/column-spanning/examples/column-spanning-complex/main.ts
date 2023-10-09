import {
  CellClassRules,
  ColDef,
  ColSpanParams,
  GridApi,
  createGrid,
  GridOptions,
  GridReadyEvent,
  RowHeightParams,
} from '@ag-grid-community/core';
import { getData } from "./data";


var cellClassRules: CellClassRules = {
  'header-cell': 'data.section === "big-title"',
  'quarters-cell': 'data.section === "quarters"',
}

const columnDefs: ColDef[] = [
  {
    headerName: 'Jan',
    field: 'jan',
    colSpan: (params: ColSpanParams) => {
      if (isHeaderRow(params)) {
        return 6
      } else if (isQuarterRow(params)) {
        return 3
      } else {
        return 1
      }
    },
    cellClassRules: cellClassRules,
  },
  { headerName: 'Feb', field: 'feb' },
  { headerName: 'Mar', field: 'mar' },
  {
    headerName: 'Apr',
    field: 'apr',
    colSpan: (params: ColSpanParams) => {
      if (isQuarterRow(params)) {
        return 3
      } else {
        return 1
      }
    },
    cellClassRules: cellClassRules,
  },
  { headerName: 'May', field: 'may' },
  { headerName: 'Jun', field: 'jun' },
]

let api: GridApi;

const gridOptions: GridOptions = {
  getRowHeight: (params: RowHeightParams) => {
    if (isHeaderRow(params)) {
      return 60
    }
  },
  columnDefs: columnDefs,
  rowData: getData(),
  defaultColDef: {
    width: 100,
  },
  onGridReady: (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit()
  },
}


function isHeaderRow(params: RowHeightParams | ColSpanParams) {
  return params.data.section === 'big-title'
}

function isQuarterRow(params: ColSpanParams) {
  return params.data.section === 'quarters'
}



// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  api = createGrid(gridDiv, gridOptions);;
})
