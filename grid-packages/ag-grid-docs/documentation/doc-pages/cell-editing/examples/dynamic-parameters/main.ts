function countyToCityMap(match) {
    const map = {
        'Ireland': ['Dublin', 'Cork', 'Galway'],
        'USA': ['New York', 'Los Angeles', 'Chicago', 'Houston']
    };

    return map[match];
};

function onCellValueChanged(params) {
    const colId = params.column.getId();

    if (colId === 'country') {
        const selectedCountry = params.data.country;
        const selectedCity = params.data.city;
        const allowedCities = countyToCityMap(selectedCountry);
        const cityMismatch = allowedCities.indexOf(selectedCity) < 0;

        if (cityMismatch) {
            params.node.setDataValue('city', null);
        }
    }
}

const rowData = [
    {
        name: 'Bob Harrison',
        gender: 'Male',
        address: '1197 Thunder Wagon Common, Cataract, RI, 02987-1016, US, (401) 747-0763',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Mary Wilson',
        gender: 'Female',
        age: 11,
        address: '3685 Rocky Glade, Showtucket, NU, X1E-9I0, CA, (867) 371-4215',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Sadiq Khan',
        gender: 'Male',
        age: 12,
        address: '3235 High Forest, Glen Campbell, MS, 39035-6845, US, (601) 638-8186',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Jerry Mane',
        gender: 'Male',
        age: 12,
        address: '2234 Sleepy Pony Mall , Drain, DC, 20078-4243, US, (202) 948-3634',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Bob Harrison',
        gender: 'Male',
        address: '1197 Thunder Wagon Common, Cataract, RI, 02987-1016, US, (401) 747-0763',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Mary Wilson',
        gender: 'Female',
        age: 11,
        address: '3685 Rocky Glade, Showtucket, NU, X1E-9I0, CA, (867) 371-4215',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Sadiq Khan',
        gender: 'Male',
        age: 12,
        address: '3235 High Forest, Glen Campbell, MS, 39035-6845, US, (601) 638-8186',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Jerry Mane',
        gender: 'Male',
        age: 12,
        address: '2234 Sleepy Pony Mall , Drain, DC, 20078-4243, US, (202) 948-3634',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Bob Harrison',
        gender: 'Male',
        address: '1197 Thunder Wagon Common, Cataract, RI, 02987-1016, US, (401) 747-0763',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Mary Wilson',
        gender: 'Female',
        age: 11,
        address: '3685 Rocky Glade, Showtucket, NU, X1E-9I0, CA, (867) 371-4215',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Sadiq Khan',
        gender: 'Male',
        age: 12,
        address: '3235 High Forest, Glen Campbell, MS, 39035-6845, US, (601) 638-8186',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Jerry Mane',
        gender: 'Male',
        age: 12,
        address: '2234 Sleepy Pony Mall , Drain, DC, 20078-4243, US, (202) 948-3634',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Bob Harrison',
        gender: 'Male',
        address: '1197 Thunder Wagon Common, Cataract, RI, 02987-1016, US, (401) 747-0763',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Mary Wilson',
        gender: 'Female',
        age: 11,
        address: '3685 Rocky Glade, Showtucket, NU, X1E-9I0, CA, (867) 371-4215',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Sadiq Khan',
        gender: 'Male',
        age: 12,
        address: '3235 High Forest, Glen Campbell, MS, 39035-6845, US, (601) 638-8186',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Jerry Mane',
        gender: 'Male',
        age: 12,
        address: '2234 Sleepy Pony Mall , Drain, DC, 20078-4243, US, (202) 948-3634',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Bob Harrison',
        gender: 'Male',
        address: '1197 Thunder Wagon Common, Cataract, RI, 02987-1016, US, (401) 747-0763',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Mary Wilson',
        gender: 'Female',
        age: 11,
        address: '3685 Rocky Glade, Showtucket, NU, X1E-9I0, CA, (867) 371-4215',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Sadiq Khan',
        gender: 'Male',
        age: 12,
        address: '3235 High Forest, Glen Campbell, MS, 39035-6845, US, (601) 638-8186',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Jerry Mane',
        gender: 'Male',
        age: 12,
        address: '2234 Sleepy Pony Mall , Drain, DC, 20078-4243, US, (202) 948-3634',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Bob Harrison',
        gender: 'Male',
        address: '1197 Thunder Wagon Common, Cataract, RI, 02987-1016, US, (401) 747-0763',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Mary Wilson',
        gender: 'Female',
        age: 11,
        address: '3685 Rocky Glade, Showtucket, NU, X1E-9I0, CA, (867) 371-4215',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Sadiq Khan',
        gender: 'Male',
        age: 12,
        address: '3235 High Forest, Glen Campbell, MS, 39035-6845, US, (601) 638-8186',
        city: 'Dublin',
        country: 'Ireland'
    },
    {
        name: 'Jerry Mane',
        gender: 'Male',
        age: 12,
        address: '2234 Sleepy Pony Mall , Drain, DC, 20078-4243, US, (202) 948-3634',
        city: 'Dublin',
        country: 'Ireland'
    },
];

const cellCellEditorParams = params => {
    const selectedCountry = params.data.country;
    const allowedCities = countyToCityMap(selectedCountry);

    return {
        values: allowedCities,
        formatValue: value => `${value} (${selectedCountry})`
    };
};

const gridOptions = {
    columnDefs: [
        {field: 'name'},
        {
            field: 'gender',
            cellRenderer: 'genderCellRenderer',
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                values: ['Male', 'Female'],
                cellRenderer: 'genderCellRenderer'
            }
        },
        {
            field: 'country',
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                cellHeight: 50,
                values: ['Ireland', 'USA']
            }
        },
        {
            field: 'city',
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: cellCellEditorParams
        },
        {field: 'address', cellEditor: 'agLargeTextCellEditor', minWidth: 550}
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 130,
        editable: true,
        resizable: true
    },
    components: {
        'genderCellRenderer': GenderCellRenderer
    },
    rowData: rowData,
    onCellValueChanged: onCellValueChanged
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);
});
