import type { ColDef, ColGroupDef, GridOptions } from '@ag-grid-community/core';
import { defaultRowData } from './grid-data';

export const gridConfigBooleanFields = [
  'advancedFilter',
  'filtersToolPanel',
  'columnsToolPanel',
  'columnGroups',
  'columnHover',
  'rowGrouping',
  'columnResizing',
  'rowDrag',
  'rowSelection',
  'rightToLeft',
  'floatingFilters',
  'printLayout',
  'legacyColumnMenu',
  'showIntegratedChartPopup',
  'statusBar',
  'pagination',
  'showOverlay',
] as const;

type GridConfigBooleanField = (typeof gridConfigBooleanFields)[number];

export type GridConfig = {
  [K in GridConfigBooleanField]?: boolean;
};

export const buildGridOptions = (config: GridConfig): GridOptions => {
  const defaultColDef: ColDef = {
    sortable: true,
    resizable: config.columnResizing,
    enableRowGroup: true,
    floatingFilter: config.floatingFilters,
    editable: true,
    flex: config.printLayout ? undefined : 1,
  };
  const columnDefs = buildSimpleColumnDefs();
  const sideBar: string[] = [];
  const options: GridOptions = {
    defaultColDef,
    sideBar,
    enableCharts: true,
    columnHoverHighlight: config.columnHover,
    enableRangeSelection: true,
    rowData: defaultRowData(),
    columnDefs: config.columnGroups ? buildGroupColumnDefs(columnDefs) : columnDefs,
    enableRtl: config.rightToLeft,
    domLayout: config.printLayout ? 'print' : undefined,
    columnMenu: config.legacyColumnMenu ? 'legacy' : 'new',
    animateRows: false,
  };

  if (config.advancedFilter) {
    options.enableAdvancedFilter = true;
    options.advancedFilterBuilderParams = {
      showMoveButtons: true,
    };
    defaultColDef.filter = true;
  }

  if (config.columnsToolPanel) {
    sideBar.push('columns');
  }

  if (config.filtersToolPanel) {
    sideBar.push('filters');
    defaultColDef.filter = true;
  }

  if (config.rowDrag) {
    columnDefs[0].rowDrag = true;
  }

  if (config.rowGrouping) {
    columnDefs[0].rowGroup = true;
    columnDefs[1].rowGroup = true;
    options.rowGroupPanelShow = 'always';
  }

  if (config.rowSelection) {
    options.rowSelection = 'multiple';
    options.autoGroupColumnDef = {
      headerName: 'Group',
      field: 'name',
      headerCheckboxSelection: true,
      cellRendererParams: {
        checkbox: true,
      },
    };
    
    if (!config.rowGrouping) {
      columnDefs[0].checkboxSelection = (params) => {
        // we put checkbox on the name if we are not doing grouping
        return params.api.getRowGroupColumns().length === 0;
      };
      columnDefs[0].headerCheckboxSelection = (params) => {
        // we put checkbox on the name if we are not doing grouping
        return params.api.getRowGroupColumns().length === 0;
      };
    }
  }

  if (config.statusBar) {
    options.statusBar = {
      statusPanels: [
        {
          statusPanel: 'agTotalRowCountComponent',
          align: 'left',
        },
        {
          statusPanel: 'agFilteredRowCountComponent',
          align: 'left',
        },
        { statusPanel: 'agSelectedRowCountComponent', align: 'left' },
        { statusPanel: 'agAggregationComponent', align: 'right' },
      ],
    };
  }

  if (config.pagination) {
    options.pagination = true;
    options.paginationPageSize = 25;
    options.paginationPageSizeSelector = [5, 10, 25, 50, 100];
  }

  return options;
};

// Currently breaks rowGrouping
const cashFormatter = (params) => {
    return "$" + params.value.toLocaleString();
};

const buildSimpleColumnDefs = (): ColDef[] => [
  { field: 'name' },
  { field: 'sport' },
  { field: 'country' },
  { field: 'winningsTotal', headerName: 'Total winnings', type: 'rightAligned', valueFormatter: cashFormatter },
  { field: 'winnings2023', headerName: '2023 winnings', type: 'rightAligned', valueFormatter: cashFormatter },
  { field: 'winnings2022', headerName: '2022 winnings', type: 'rightAligned', valueFormatter: cashFormatter },
];

const buildGroupColumnDefs = (columns: ColDef[]): ColGroupDef[] => [
  {
    headerName: 'Name',
    children: columns.filter((c) => c.field === 'sport' || c.field === 'country'),
  },
  {
    headerName: 'Sport',
    children: columns.filter((c) => c.field !== 'name' && c.field !== 'country'),
  },
];