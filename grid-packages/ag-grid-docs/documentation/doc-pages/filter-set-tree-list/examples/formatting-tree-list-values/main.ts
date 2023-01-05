import { Grid, GridOptions, ISetFilterParams, ValueFormatterParams } from '@ag-grid-community/core'

const gridOptions: GridOptions = {
  columnDefs: [
    { field: 'athlete' },
    { field: 'sport' },
    {
      field: 'date',
      valueFormatter: dateValueFormatter,
      filter: 'agSetColumnFilter',
      filterParams: {
        treeList: true,
        treeListFormatter: treeListFormatter,
        valueFormatter: dateValueFormatter,
      } as ISetFilterParams<any, Date>
    },
    {
      field: 'gold',
    },
  ],
  defaultColDef: {
    flex: 1,
    resizable: true,
    floatingFilter: true,
  },
}

function dateValueFormatter(params: ValueFormatterParams) {
  return params.value ? params.value.toLocaleDateString() : '';
} 


function treeListFormatter(pathKey: string | null, level: number): string {
  if (level === 1) {
    const date = new Date();
    date.setMonth(Number(pathKey) -1);
    return date.toLocaleDateString(undefined, {month: 'long'});
  }
  return pathKey || '(Blanks)';
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
  var gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  new Grid(gridDiv, gridOptions)

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: any[]) => gridOptions.api!.setRowData([
      {},
      ...data.map(row => {
        const dateParts = row.date.split('/');
        const newDate = new Date(
          parseInt(dateParts[2]),
          dateParts[1] - Math.floor(Math.random() * 3),
          Math.ceil(Math.random() * 28)
        );
        return {...row, date: newDate};
      })
    ]))
})
