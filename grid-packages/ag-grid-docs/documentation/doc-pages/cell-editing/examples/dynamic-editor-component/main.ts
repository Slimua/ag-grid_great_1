import { CellEditingStartedEvent, CellEditingStoppedEvent, ColDef, GridOptions, ICellEditorParams, RowEditingStartedEvent, RowEditingStoppedEvent } from '@ag-grid-community/core'
declare var NumericCellEditor: any;
declare var MoodEditor: any;

const columnDefs: ColDef[] = [
  {
    field: 'value',
    editable: true,
    cellEditorSelector: cellEditorSelector,
  },
  { field: 'type' },
]

const gridOptions: GridOptions = {
  columnDefs: columnDefs,
  defaultColDef: {
    flex: 1,
  },
  rowData: getData(),

  components: {
    numericCellEditor: NumericCellEditor,
    moodEditor: MoodEditor,
  },

  onRowEditingStarted: onRowEditingStarted,
  onRowEditingStopped: onRowEditingStopped,
  onCellEditingStarted: onCellEditingStarted,
  onCellEditingStopped: onCellEditingStopped,
}

function onRowEditingStarted(event: RowEditingStartedEvent) {
  console.log('never called - not doing row editing')
}

function onRowEditingStopped(event: RowEditingStoppedEvent) {
  console.log('never called - not doing row editing')
}

function onCellEditingStarted(event: CellEditingStartedEvent) {
  console.log('cellEditingStarted')
}

function onCellEditingStopped(event: CellEditingStoppedEvent) {
  console.log('cellEditingStopped')
}

function cellEditorSelector(params: ICellEditorParams) {
  if (params.data.type === 'age') {
    return {
      component: 'numericCellEditor',
    }
  }

  if (params.data.type === 'gender') {
    return {
      component: 'agRichSelectCellEditor',
      params: {
        values: ['Male', 'Female'],
      },
    }
  }

  if (params.data.type === 'mood') {
    return {
      component: 'moodEditor',
    }
  }

  return undefined
}

function getCharCodeFromEvent(event: any) {
  event = event || window.event
  return typeof event.which == 'undefined' ? event.keyCode : event.which
}

function isCharNumeric(charStr: string) {
  return !!/\d/.test(charStr)
}

function isKeyPressedNumeric(event: any) {
  var charCode = getCharCodeFromEvent(event)
  var charStr = String.fromCharCode(charCode)
  return isCharNumeric(charStr)
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector('#myGrid')
  new agGrid.Grid(gridDiv, gridOptions)
})
