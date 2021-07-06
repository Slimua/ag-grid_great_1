const columnDefs = [
    {
        headerName: "String (editable)",
        field: "simple",
        editable: true,
    },
    {
        headerName: "Bad Number (editable)",
        field: "numberBad",
        editable: true,
    },
    {
        headerName: "Good Number (editable)",
        field: "numberGood",
        editable: true,
        valueFormatter: `"£" + Math.floor(value).toString().replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1,")`,
        valueParser: 'Number(newValue)'
    },
    {
        headerName: "Name (editable)",
        editable: true,
        valueGetter: 'data.firstName + " " + data.lastName',
        valueSetter:
            // an expression can span multiple lines!!!
            `var nameSplit = newValue.split(" ");
             var newFirstName = nameSplit[0];
             var newLastName = nameSplit[1];
             if (data.firstName !== newFirstName || data.lastName !== newLastName) {  
                data.firstName = newFirstName;  
                data.lastName = newLastName;  
                return true;
            } else {  
                return false;
            }`
    },
    {headerName: "A", field: 'a', maxWidth: 120},
    {headerName: "B", field: 'b', maxWidth: 120},
    {headerName: "A + B", valueGetter: 'data.a + data.b', maxWidth: 120}
];

const gridOptions = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 200,
        resizable: true
    },
    enableRangeSelection: true,
    rowData: createRowData(),
    onCellValueChanged: onCellValueChanged
};

function createRowData() {
    const rowData = [];

    const words = ['One', 'Apple', 'Moon', 'Sugar', 'Grid', 'Banana', 'Sunshine', 'Stars', 'Black', 'White', 'Salt', 'Beach'];
    const firstNames = ['Niall', 'John', 'Rob', 'Alberto', 'Bas', 'Dimple', 'Sean'];
    const lastNames = ['Pink', 'Black', 'White', 'Brown', 'Smith', 'Smooth', 'Anderson'];

    for (let i = 0; i < 100; i++) {
        const randomWords = words[i % words.length] + ' ' + words[i * 17 % words.length];
        rowData.push({
            simple: randomWords,
            numberBad: Math.floor(((i + 2) * 173456) % 10000),
            numberGood: Math.floor(((i + 2) * 476321) % 10000),
            a: Math.floor(i % 4),
            b: Math.floor(i % 7),
            firstName: firstNames[i % firstNames.length],
            lastName: lastNames[i % lastNames.length]
        });
    }

    return rowData;
}

function onCellValueChanged(event) {
    console.log('data after changes is: ', event.data);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    const gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);
    gridOptions.api.sizeColumnsToFit();
});
