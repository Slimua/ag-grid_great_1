import { GridApi, createGrid, GridOptions } from '@ag-grid-community/core';

interface IOlympicDataTypes extends IOlympicData {
  dateObject: Date;
  hasGold: boolean;
  countryObject: {
    name: string;
  };
}

let api: GridApi<IOlympicDataTypes>;

const gridOptions: GridOptions<IOlympicDataTypes> = {
  columnDefs: [
    { field: 'athlete' },
    { field: 'age', minWidth: 100 },
    { field: 'hasGold', minWidth: 100, headerName: 'Gold' },
    { field: 'dateObject', headerName: 'Date' },
    { field: 'date', headerName: 'Date (String)' },
    { field: 'countryObject', headerName: 'Country' },
  ],
  defaultColDef: {
    flex: 1,
    minWidth: 180,
    filter: true,
    floatingFilter: true,
    sortable: true,
    resizable: true,
    editable: true,
    enableRowGroup: true,
  },
  dataTypeDefinitions: {
    object: {
      baseDataType: 'object',
      extendsDataType: 'object',
      valueParser: params => ({ name: params.newValue }),
      valueFormatter: params => params.value == null ? '' : params.value.name,
    }
  },
  enableFillHandle: true,
  enableRangeSelection: true,
  rowGroupPanelShow: 'always',
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  api = createGrid(gridDiv, gridOptions);;

  // do http request to get our sample data - not using any framework to keep the example self contained.
  // you will probably use a framework like JQuery, Angular or something else to do your HTTP calls.
  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then((data: IOlympicDataTypes[]) => api!.setRowData(data.map(rowData => {
      const dateParts = rowData.date.split('/');
      return {
        ...rowData,
        date: `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
        dateObject: new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0])),
        countryObject: {
          name: rowData.country,
        },
        hasGold: rowData.gold > 0,
      };
    })))
})
