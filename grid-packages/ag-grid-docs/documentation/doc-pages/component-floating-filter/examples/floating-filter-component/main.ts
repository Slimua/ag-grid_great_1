import { ColDef, GridApi, createGrid, GridOptions, INumberFilterParams } from '@ag-grid-community/core';
import { SliderFloatingFilter } from './sliderFloatingFilter_typescript';

const filterParams: INumberFilterParams = {
  filterOptions: ['greaterThan'],
  maxNumConditions: 1,
};

const columnDefs: ColDef[] = [
  { field: 'athlete', filter: false },
  {
    field: 'gold',
    filter: 'agNumberColumnFilter',
    filterParams: filterParams,
    floatingFilterComponent: SliderFloatingFilter,
    floatingFilterComponentParams: {
      maxValue: 7,
      suppressFilterButton: true,
    },
    suppressMenu: false,
  },
  {
    field: 'silver',
    filter: 'agNumberColumnFilter',
    filterParams: filterParams,
    floatingFilterComponent: SliderFloatingFilter,
    floatingFilterComponentParams: {
      maxValue: 5,
      suppressFilterButton: true,
    },
    suppressMenu: false,
  },
  {
    field: 'bronze',
    filter: 'agNumberColumnFilter',
    filterParams: filterParams,
    floatingFilterComponent: SliderFloatingFilter,
    floatingFilterComponentParams: {
      maxValue: 10,
      suppressFilterButton: true,
    },
    suppressMenu: false,
  },
]

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
  defaultColDef: {
    flex: 1,
    minWidth: 100,
    filter: true,
    floatingFilter: true,
  },
  columnDefs: columnDefs,
  rowData: null,
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector<HTMLElement>('#myGrid')!
  gridApi = createGrid(gridDiv, gridOptions);

  fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then((data: IOlympicData[]) => {
            gridApi!.setGridOption('rowData', data)
        })
})
