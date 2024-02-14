'use strict';
import React, {useState, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AgGridReact } from '@ag-grid-community/react';;
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { ColDef, ColGroupDef, ValueGetterParams, ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule])

const CustomButtonComponent = () => {
    return <button onClick={() => window.alert('clicked') }>Push Me!</button>;
  };

const GridExample = () => {
    const [rowData, setRowData] = useState<any[]>([
    { make: "Tesla", model: "Model Y", price: 64950, electric: true },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    { make: 'Mercedes', model: 'EQA', price: 48890, electric: true },
    { make: 'Fiat', model: '500', price: 15774, electric: false },
    { make: 'Nissan', model: 'Juke', price: 20675, electric: false },
]);
    const [columnDefs, setColumnDefs] = useState<(ColDef<any, any> | ColGroupDef<any>)[]>([
    { headerName: "Make & Model", valueGetter: (p: ValueGetterParams) => p.data.make + ' ' + p.data.model, flex: 2 },
    { field: "price", valueFormatter: p => '£' + Math.floor(p.value).toLocaleString(), flex: 1 },
    { field: "electric", flex: 1 },
    { field: "button", cellRenderer: CustomButtonComponent, flex: 1 }
]);
return (
  <div style={{ width: '100%', height: '100%' }}>
    <div
      style={{ width: '100%', height: '100%' }}
      className="ag-theme-quartz"
    >
      <AgGridReact rowData={rowData} columnDefs={columnDefs} />
    </div>
  </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<StrictMode><GridExample /></StrictMode>);
