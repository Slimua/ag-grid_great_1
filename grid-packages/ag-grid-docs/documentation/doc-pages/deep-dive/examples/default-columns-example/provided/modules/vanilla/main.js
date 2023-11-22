// Grid API: Access to Grid API methods
let gridApi;

// Grid Options: Contains all of the grid configurations
const gridOptions = {
  // Row Data: The data to be displayed.
  rowData: [],
  // Column Definitions: Defines & controls grid columns.
  columnDefs: [
    { field: "mission", filter: true },
    { field: "country" },
    { field: "successful" },
    { field: "date" },
    { field: "price" },
    { field: "company" }
  ],
  // Configurations applied to all columns
  defaultColDef: {
    filter: true,
    editable: true
  },
}

// Create Grid: Create new grid within the #myGrid div, using the Grid Options object
gridApi = agGrid.createGrid(document.querySelector('#myGrid'), gridOptions);

// Fetch Remote Data
fetch('https://downloads.jamesswinton.com/space-mission-data.json')
  .then(response => response.json())
  .then((data) => gridApi.setGridOption('rowData', data))