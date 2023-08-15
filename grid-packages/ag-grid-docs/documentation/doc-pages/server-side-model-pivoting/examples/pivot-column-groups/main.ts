import { Grid, ColDef, ColGroupDef, ColumnApi, GridOptions, IServerSideDatasource, IServerSideGetRowsRequest, ColumnGroup } from '@ag-grid-community/core'
declare var FakeServer: any;
const gridOptions: GridOptions<IOlympicData> = {
  columnDefs: [
    { field: 'country', rowGroup: true },
    { field: 'sport', rowGroup: true },
    { field: 'year', pivot: true }, // pivot on 'year'
    { field: 'total', aggFunc: 'sum' },
    { field: 'gold', aggFunc: 'sum' },
    { field: 'silver', aggFunc: 'sum' },
    { field: 'bronze', aggFunc: 'sum' },
  ],
  defaultColDef: {
    width: 150,
    resizable: true,
    sortable: true,
  },
  autoGroupColumnDef: {
    minWidth: 200,
  },

  // use the server-side row model
  rowModelType: 'serverSide',

  // enable pivoting
  pivotMode: true,

  animateRows: true,

  processPivotResultColDef: colDef => {
    const pivotValueColumn = colDef.pivotValueColumn;

    if (!pivotValueColumn) return;

    // if column is not the total column, it should only be shown when expanded.
    // this will enable expandable column groups.
    if (pivotValueColumn.getColId() !== 'total') {
      colDef.columnGroupShow = 'open';
    }
  }
}

function expand(key?: string) {
  if (key) {
    gridOptions.columnApi!.setColumnGroupState([{ groupId: key, open: true }]);
    return;
  }

  const existingState = gridOptions.columnApi!.getColumnGroupState();
  const expandedState = existingState.map((s: { groupId: string, open: boolean }) => ({ groupId: s.groupId, open: true }));
  gridOptions.columnApi!.setColumnGroupState(expandedState);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  new Grid(gridDiv, gridOptions)

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then(function (data) {
      // setup the fake server with entire dataset
      var fakeServer = new FakeServer(data)

      // create datasource with a reference to the fake server
      var datasource = getServerSideDatasource(fakeServer)

      // register the datasource with the grid
      gridOptions.api!.setServerSideDatasource(datasource)
    })
})

function getServerSideDatasource(server: any): IServerSideDatasource {
  return {
    getRows: (params) => {
      var request = params.request

      console.log('[Datasource] - rows requested by grid: ', params.request)

      var response = server.getData(request)

      // simulating real server call with a 500ms delay
      setTimeout(function () {
        if (response.success) {
          // supply data to grid
          params.success({
            rowData: response.rows,
            rowCount: response.lastRow,
            pivotResultFields: response.pivotFields,
          });
        } else {
          params.fail()
        }
      }, 500)
    },
  }
}

function createPivotColDefs(request: IServerSideGetRowsRequest, pivotFields: string[]) {
  function addColDef(colId: string, parts: string[], res: (ColDef | ColGroupDef)[]) {
    if (parts.length === 0) return []

    var first = parts.shift()

    var existing: ColGroupDef = res.filter(function (r: ColDef | ColGroupDef) {
      return 'groupId' in r && r.groupId === first;
    })[0] as ColGroupDef;
    if (existing) {
      existing['children'] = addColDef(colId, parts, existing.children)
    } else {
      var colDef: any = {}
      var isGroup = parts.length > 0
      if (isGroup) {
        colDef['groupId'] = first
        colDef['headerName'] = first
      } else {
        var valueCol = request.valueCols.filter(function (r) {
          return r.field === first
        })[0]
        colDef['colId'] = colId
        colDef['headerName'] = valueCol.displayName
        colDef['field'] = colId

        // comment out this line to remove expandable groups
        colDef['columnGroupShow'] = (valueCol.id === 'total') ? undefined : 'open';
      }

      var children = addColDef(colId, parts, [])
      children.length > 0 ? (colDef['children'] = children) : null

      res.push(colDef)
    }

    return res
  }

  if (request.pivotMode && request.pivotCols.length > 0) {
    var pivotResultCols: ColGroupDef[] = []
    pivotFields.forEach(function (field) {
      addColDef(field, field.split('_'), pivotResultCols)
    })
    return pivotResultCols
  }

  return []
}
