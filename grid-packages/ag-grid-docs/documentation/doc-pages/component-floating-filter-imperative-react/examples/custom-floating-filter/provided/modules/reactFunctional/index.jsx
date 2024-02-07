'use strict';

import React, { useCallback, useMemo, useState, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AgGridReact } from '@ag-grid-community/react';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import NumberFloatingFilterComponent from './numberFloatingFilterComponent.jsx';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule])

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
        { field: 'athlete', filter: false },
        {
            field: 'gold',
            filter: 'agNumberColumnFilter',
            suppressMenu: true,
            floatingFilterComponent: NumberFloatingFilterComponent,
            floatingFilterComponentParams: {
                color: 'gold',
            },
            suppressFloatingFilterButton: true,
        },
        {
            field: 'silver',
            filter: 'agNumberColumnFilter',
            suppressMenu: true,
            floatingFilterComponent: NumberFloatingFilterComponent,
            floatingFilterComponentParams: {
                color: 'silver',
            },
            suppressFloatingFilterButton: true,
        },
        {
            field: 'bronze',
            filter: 'agNumberColumnFilter',
            suppressMenu: true,
            floatingFilterComponent: NumberFloatingFilterComponent,
            floatingFilterComponentParams: {
                color: '#CD7F32',
            },
            suppressFloatingFilterButton: true,
        },
        {
            field: 'total',
            filter: 'agNumberColumnFilter',
            suppressMenu: true,
            floatingFilterComponent: NumberFloatingFilterComponent,
            floatingFilterComponentParams: {
                color: 'unset',
            },
            suppressFloatingFilterButton: true,
        },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 100,
            filter: true,
            floatingFilter: true,
        }
    }, []);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then(resp => resp.json())
            .then(data => {
                setRowData(data);
            });
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle} className={/** DARK MODE START **/document.documentElement.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                />
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<StrictMode><GridExample /></StrictMode>);
