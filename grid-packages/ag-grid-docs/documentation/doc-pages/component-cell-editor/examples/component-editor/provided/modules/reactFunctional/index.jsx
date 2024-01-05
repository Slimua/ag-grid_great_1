'use strict';

import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import DoublingEditor from './doublingEditor.jsx';
import MoodEditor from './moodEditor.jsx';
import MoodRenderer from './moodRenderer.jsx';
import NumericEditor from './numericEditor.jsx';
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import './styles.css';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const GridExample = () => {
    const [rowData] = useState([
        { name: "Bob", mood: "Happy", number: 10 },
        { name: "Harry", mood: "Sad", number: 3 },
        { name: "Sally", mood: "Happy", number: 20 },
        { name: "Mary", mood: "Sad", number: 5 },
        { name: "John", mood: "Happy", number: 15 },
        { name: "Jack", mood: "Happy", number: 25 },
        { name: "Sue", mood: "Sad", number: 43 },
        { name: "Sean", mood: "Sad", number: 1335 },
        { name: "Niall", mood: "Happy", number: 2 },
        { name: "Alberto", mood: "Happy", number: 123 },
        { name: "Fred", mood: "Sad", number: 532 },
        { name: "Jenny", mood: "Happy", number: 34 },
        { name: "Larry", mood: "Happy", number: 13 },
    ]);

    const columnDefs = useMemo(() => [
        {
            headerName: 'Doubling',
            field: 'number',
            cellEditor: DoublingEditor,
            editable: true,
            width: 300,
        },
        {
            field: 'mood',
            cellRenderer: MoodRenderer,
            cellEditor: MoodEditor,
            cellEditorPopup: true,
            editable: true,
            width: 300,
        },
        {
            headerName: 'Numeric',
            field: 'number',
            cellEditor: NumericEditor,
            editable: true,
            width: 280,
        },
    ], [])

    const defaultColDef = useMemo(() => ({
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    }), []);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div
                style={{
                    height: '100%',
                    width: '100%'
                }}
                className={/** DARK MODE START **/document.documentElement.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/}>
                <AgGridReact
                    columnDefs={columnDefs}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    reactiveCustomComponents
                />
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<GridExample />);
