import { GridApi, createGrid, ColDef, GridOptions } from '@ag-grid-community/core';

function getColumnDefs(): ColDef[] {
  return [
    { field: 'athlete', initialWidth: 100, initialSort: 'asc' },
    { field: 'age' },
    { field: 'country', initialPinned: 'left' },
    { field: 'sport' },
    { field: 'year' },
    { field: 'date' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
  ]
}

let api: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  defaultColDef: {
    initialWidth: 100,
    sortable: true,
    resizable: true,
  },
  columnDefs: getColumnDefs(),
}

function onBtWithDefault() {
  api!.setColumnDefs(getColumnDefs())
}

function onBtRemove() {
  api!.setColumnDefs([])
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  api = createGrid(gridDiv, gridOptions);;

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicData[]) => api!.setRowData(data))
})
