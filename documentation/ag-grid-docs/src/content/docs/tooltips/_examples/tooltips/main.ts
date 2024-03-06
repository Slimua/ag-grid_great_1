import { GridApi, createGrid, ColDef, ColGroupDef, GridOptions, ITooltipParams } from '@ag-grid-community/core';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from "@ag-grid-community/core";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const columnDefs: (ColDef|ColGroupDef)[] = [
  {
    headerName: 'Athlete',
    field: 'athlete',
    // here the Athlete column will tooltip the Country value
    tooltipField: 'country',
    headerTooltip: 'Tooltip for Athlete Column Header',
  },
  {
    field: 'age',
    tooltipValueGetter: (p: ITooltipParams) => 'Create any fixed message, eg This is the Athelets Age',
    headerTooltip: 'Tooltip for Age Column Header',
  },
  {
    field: 'year',
    tooltipValueGetter: (p: ITooltipParams) => 'This is a dynamic tooltip using the value of ' + p.value,
    headerTooltip: 'Tooltip for Year Column Header',
  },
  {
    headerName: 'Hover For Tooltip',
    headerTooltip: 'Column Groups can have Tooltips also',
    children: [
      {
        field: 'sport',
        tooltipValueGetter: () => 'Tooltip text about Sport should go here',
        headerTooltip: 'Tooltip for Sport Column Header',
      }    
    ]
  }
]

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  defaultColDef: {
    flex: 1,
    minWidth: 100
  },
  rowData: null,
  columnDefs: columnDefs,
  tooltipShowDelay: 500,
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
    .then(response => response.json())
    .then(data => {
      gridApi!.setGridOption('rowData', data)
    })
})