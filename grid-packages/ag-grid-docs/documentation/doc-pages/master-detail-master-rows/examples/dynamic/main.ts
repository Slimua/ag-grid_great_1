import {
  GridApi,
  createGrid,
  FirstDataRenderedEvent,
  GridOptions,
  IDetailCellRendererParams,
} from '@ag-grid-community/core';

let api: GridApi;

const gridOptions: GridOptions = {
  masterDetail: true,
  isRowMaster: (dataItem: any) => {
    return dataItem ? dataItem.callRecords.length > 0 : false
  },
  columnDefs: [
    // group cell renderer needed for expand / collapse icons
    { field: 'name', cellRenderer: 'agGroupCellRenderer' },
    { field: 'account' },
    { field: 'calls' },
    { field: 'minutes', valueFormatter: "x.toLocaleString() + 'm'" },
  ],
  defaultColDef: {
    flex: 1,
  },
  detailCellRendererParams: {
    detailGridOptions: {
      columnDefs: [
        { field: 'callId' },
        { field: 'direction' },
        { field: 'number', minWidth: 150 },
        { field: 'duration', valueFormatter: "x.toLocaleString() + 's'" },
        { field: 'switchCode', minWidth: 150 },
      ],
      defaultColDef: {
        flex: 1,
      },
    },
    getDetailRowData: function (
      params) {
      params.successCallback(params.data.callRecords)
    },
  } as IDetailCellRendererParams<IAccount, ICallRecord>,
  onFirstDataRendered: onFirstDataRendered,
}

function onFirstDataRendered(params: FirstDataRenderedEvent) {
  // arbitrarily expand a row for presentational purposes
  setTimeout(function () {
    params.api.getDisplayedRowAtIndex(1)!.setExpanded(true)
  }, 0)
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  api = createGrid(gridDiv, gridOptions);;

  fetch(
    'https://www.ag-grid.com/example-assets/master-detail-dynamic-data.json'
  )
    .then(response => response.json())
    .then(function (data) {
      api!.setRowData(data)
    })
})
