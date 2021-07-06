var rowData = [
    { country: 'Ireland', state: null, city: 'Dublin' },
    { country: 'Ireland', state: null, city: 'Galway' },
    { country: 'Ireland', state: null, city: 'Cork' },

    { country: 'United Kingdom', state: null, city: 'London' },
    { country: 'United Kingdom', state: null, city: 'Manchester' },
    { country: 'United Kingdom', state: null, city: 'Liverpool' },

    { country: 'USA', state: 'New York', city: 'New York' },
    { country: 'USA', state: 'New York', city: 'Albany' },
    { country: 'USA', state: 'New York', city: 'Onondaga' },
    { country: 'USA', state: 'New York', city: 'Westchester' },

    { country: 'USA', state: 'California', city: 'San Diego' },
    { country: 'USA', state: 'California', city: 'San Francisco' }
];

rowData.forEach(function(item, i) {
    item.val1 = ((i + 13) * 17 * 33) % 1000;
    item.val2 = ((i + 23) * 17 * 33) % 1000;
});

var gridOptions = {
    columnDefs: [
        { field: "city", type: 'dimension', cellRenderer: 'cityCellRenderer' },
        { field: "country", type: 'dimension', cellRenderer: 'countryCellRenderer', minWidth: 200 },
        { field: "state", type: 'dimension', cellRenderer: 'stateCellRenderer', rowGroup: true },
        { field: "val1", type: 'numberValue' },
        { field: "val2", type: 'numberValue' }
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        resizable: true,
    },
    autoGroupColumnDef: {
        field: 'city',
        minWidth: 200,
    },
    columnTypes: {
        'numberValue': {
            enableValue: true,
            aggFunc: 'sum',
            editable: true,
            valueParser: numberParser,
        },
        'dimension': {
            enableRowGroup: true,
            enablePivot: true,
        }
    },
    components: {
        cityCellRenderer: cityCellRenderer,
        countryCellRenderer: countryCellRenderer,
        stateCellRenderer: stateCellRenderer
    },
    rowData: rowData,
    groupDefaultExpanded: -1,
    rowGroupPanelShow: 'always',
    animateRows: true,
};

var COUNTRY_CODES = {
    Ireland: "ie",
    "United Kingdom": "gb",
    "USA": "us"
};

function numberParser(params) {
    return parseInt(params.newValue);
}

function countryCellRenderer(params) {
    if (params.value === undefined || params.value === null) {
        return '';
    } else {
        var flag = '<img border="0" width="15" height="10" src="https://flagcdn.com/h20/' + COUNTRY_CODES[params.value] + '.png">';
        return flag + ' ' + params.value;
    }
}

function stateCellRenderer(params) {
    if (params.value === undefined || params.value === null) {
        return '';
    } else {
        var flag = '<img border="0" width="15" height="10" src="https://www.ag-grid.com/example-assets/gold-star.png">';
        return flag + ' ' + params.value;
    }
}

function cityCellRenderer(params) {
    if (params.value === undefined || params.value === null) {
        return '';
    } else {
        var flag = '<img border="0" width="15" height="10" src="https://www.ag-grid.com/example-assets/weather/sun.png">';
        return flag + ' ' + params.value;
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);
});
