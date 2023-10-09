import { GridApi, createGrid, ColDef, GridOptions } from '@ag-grid-community/core';
import { ClickableStatusBarComponent } from './clickableStatusBarComponent_typescript'

const columnDefs: ColDef[] = [
  {
    field: 'row',
  },
  {
    field: 'name',
  },
]

let api: GridApi;

const gridOptions: GridOptions = {
  defaultColDef: {
    flex: 1,
    minWidth: 100,
    resizable: true,
  },
  columnDefs: columnDefs,
  rowData: [
    { row: 'Row 1', name: 'Michael Phelps' },
    { row: 'Row 2', name: 'Natalie Coughlin' },
    { row: 'Row 3', name: 'Aleksey Nemov' },
    { row: 'Row 4', name: 'Alicia Coutts' },
    { row: 'Row 5', name: 'Missy Franklin' },
    { row: 'Row 6', name: 'Ryan Lochte' },
    { row: 'Row 7', name: 'Allison Schmitt' },
    { row: 'Row 8', name: 'Natalie Coughlin' },
    { row: 'Row 9', name: 'Ian Thorpe' },
    { row: 'Row 10', name: 'Bob Mill' },
    { row: 'Row 11', name: 'Willy Walsh' },
    { row: 'Row 12', name: 'Sarah McCoy' },
    { row: 'Row 13', name: 'Jane Jack' },
    { row: 'Row 14', name: 'Tina Wills' },
  ],
  rowSelection: 'multiple',
  statusBar: {
    statusPanels: [
      {
        statusPanel: ClickableStatusBarComponent,
      },
    ],
  },
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  api = createGrid(gridDiv, gridOptions);;
})
