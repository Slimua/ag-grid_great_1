import { createGrid } from 'ag-grid-community';
import 'ag-grid-enterprise';

import { colorSchemeDarkNeutral, inputStyleUnderlined, tabStyleMaterial, themeQuartz } from './src/main';

themeQuartz
    .usePart(inputStyleUnderlined)
    .usePart(colorSchemeDarkNeutral)
    .usePart(tabStyleMaterial)
    .usePart(inputStyleUnderlined)
    .overrideParams({
        primaryColor: 'green',
        inputFocusBorder: { width: 2, color: { ref: 'primaryColor' } },
    })
    .install();

createGrid(document.querySelector<HTMLDivElement>('#app')!, {
    // Data to be displayed
    rowData: [
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true },
        { make: 'Fiat', model: '500', price: 15774, electric: false },
        { make: 'Nissan', model: 'Duke', price: 20675, electric: false },
    ],
    // Columns to be displayed (Should match rowData properties)
    columnDefs: [{ field: 'make' }, { field: 'model' }, { field: 'price' }, { field: 'electric' }],
    defaultColDef: {
        flex: 1,
    },
    sideBar: 'columns',
});
