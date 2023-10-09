import { GridApi, createGrid, ColDef, GridOptions } from '@ag-grid-community/core';
import { MedalCellRenderer } from './medalCellRenderer_typescript'

const columnDefs: ColDef[] = [
  { field: 'athlete', width: 150 },
  { field: 'country', width: 150 },
  { field: 'year', width: 100 },
  { field: 'gold', width: 100, cellRenderer: MedalCellRenderer },
  { field: 'silver', width: 100, cellRenderer: MedalCellRenderer },
  { field: 'bronze', width: 100, cellRenderer: MedalCellRenderer },
  { field: 'total', width: 100 },
]

let api: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: columnDefs,
  defaultColDef: {
    editable: true,
    sortable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
    resizable: true,
  },
}

function onCallGold() {
  console.log('=========> calling all gold')
  // pass in list of columns, here it's gold only
  const params = { columns: ['gold'] }
  const instances = api!.getCellRendererInstances(params) as any[]
  instances.forEach(instance => {
    instance.medalUserFunction()
  })
}

function onFirstRowGold() {
  console.log('=========> calling gold row one')
  // pass in one column and one row to identify one cell
  const firstRowNode = api!.getDisplayedRowAtIndex(0)!
  const params = { columns: ['gold'], rowNodes: [firstRowNode] }

  const instances = api!.getCellRendererInstances(params) as any[]
  instances.forEach(instance => {
    instance.medalUserFunction()
  })
}

function onCallAllCells() {
  console.log('=========> calling everything')
  // no params, goes through all rows and columns where cell renderer exists
  const instances = api!.getCellRendererInstances() as any[]
  instances.forEach(instance => {
    instance.medalUserFunction()
  })
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  api = createGrid(gridDiv, gridOptions);;

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then(data => {
      api!.setRowData(data)
    })
})
