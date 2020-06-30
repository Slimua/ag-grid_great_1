var gridOptions = {
    columnDefs: [
        { field: 'athlete', filter: 'agCombinedColumnFilter' },
        {
            field: 'country',
            filter: 'agCombinedColumnFilter',
            filterParams: {
                filters: [
                    {
                        filter: 'agTextColumnFilter',
                        filterParams: {
                            alwaysShowBothConditions: true,
                            defaultOption: 'contains',
                        },
                    },
                    {
                        filter: 'agSetColumnFilter',
                    }
                ]
            }
        },
        {
            field: 'gold',
            filter: 'agCombinedColumnFilter',
            filterParams: {
                filters: [
                    {
                        filter: 'agNumberColumnFilter',
                        filterParams: {
                            alwaysShowBothConditions: true,
                        },
                    },
                    {
                        filter: 'agSetColumnFilter',
                    }
                ]
            }
        },
        {
            field: 'date',
            filter: 'agCombinedColumnFilter',
            filterParams: {
                filters: [
                    {
                        filter: 'agDateColumnFilter',
                        filterParams: {
                            alwaysShowBothConditions: true,
                            comparator: function(filterDate, cellValue) {
                                if (cellValue == null) return -1;

                                return getDate(cellValue) - filterDate;
                            },
                        },
                    },
                    {
                        filter: 'agSetColumnFilter',
                        filterParams: {
                            alwaysShowBothConditions: true,
                            comparator: function(a, b) {
                                return getDate(a) - getDate(b);
                            }
                        }
                    }
                ]
            }
        },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        resizable: true,
        floatingFilter: true,
    },
    sideBar: {
        toolPanels: ['filters'],
    }
};

function getDate(value) {
    var dateParts = value.split('/');
    return new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));
};

var savedFilterState;

function printState() {
    var filterState = gridOptions.api.getFilterModel();
    console.log('Current filter state: ', filterState);
}

function saveState() {
    savedFilterState = gridOptions.api.getFilterModel();
    console.log('Filter state saved');
}

function restoreState() {
    gridOptions.api.setFilterModel(savedFilterState);
    console.log('Filter state restored');
}

function resetState() {
    gridOptions.api.setFilterModel(null);
    console.log('Filter state reset');
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    agGrid.simpleHttpRequest({ url: 'https://raw.githubusercontent.com/ag-grid/ag-grid/master/grid-packages/ag-grid-docs/src/olympicWinnersSmall.json' })
        .then(function(data) {
            gridOptions.api.setRowData(data);
        });
});
