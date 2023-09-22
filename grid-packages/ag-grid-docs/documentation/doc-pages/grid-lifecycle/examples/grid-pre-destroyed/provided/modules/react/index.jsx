'use strict';

import React, {Component} from 'react';
import {createRoot} from 'react-dom/client';
import {AgGridReact} from '@ag-grid-community/react';
import '@ag-grid-community/styles/ag-grid.css';
import "@ag-grid-community/styles/ag-theme-alpine.css";
import {ModuleRegistry} from '@ag-grid-community/core';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule]);

class GridExample extends Component {
    constructor(props) {
        super(props);

        this.state = {
            gridVisible: true,
            columnsWidthOnPreDestroyed: [],
            gridColumnApi: undefined,
            columnDefs: [
                {field: 'name', headerName: 'Athlete'},
                {field: 'medals.gold', headerName: 'Gold Medals'},
                {field: 'person.age', headerName: 'Age'},
            ],
            defaultColDef: {
                editable: true,
                resizable: true,
            },
            rowData: getDataSet()
        };
    }

    onGridReady = params => {
        this.setState({
            gridColumnApi: params.columnApi,
        });
    }

    onGridPreDestroyed = (params) => {
        const allColumns = params.columnApi.getColumns();
        if (!allColumns) {
            return;
        }

        const currentColumnWidths = allColumns.map(column => ({
            field: column.getColDef().field || '-',
            width: column.getActualWidth(),
        }));

        this.setState({
            columnsWidthOnPreDestroyed: currentColumnWidths,
            gridColumnApi: undefined,
        });
    }

    updateColumnWidth = () => {
        const { gridColumnApi } = this.state;
        if (!gridColumnApi) {
            return;
        }

        gridColumnApi.getColumns().forEach(column => {
            const newRandomWidth = Math.round((150 + Math.random() * 100) * 100) / 100;
            gridColumnApi.setColumnWidth(column, newRandomWidth);
        });
    }

    destroyGrid = () => {
        this.setState({
            gridVisible: false
        });
    }

    reloadGrid = () => {
        const { columnsWidthOnPreDestroyed, columnDefs } = this.state;
        const updatedColumnDefs = columnDefs.map(val => {
            const colDef = val;
            const result = {
                ...colDef,
            };

            if (colDef.field) {
                const width = columnsWidthOnPreDestroyed.find(columnWidth => columnWidth.field === colDef.field);
                result.width = width ? width.width : colDef.width;
            }

            return result;
        });

        this.setState({
            gridVisible: true,
            columnDefs: updatedColumnDefs,
            columnsWidthOnPreDestroyed: [],
        });
    }

    render() {
        const { gridVisible, columnsWidthOnPreDestroyed } = this.state;
        return (
            <div style={{width: '100%', height: '100%'}}>
              <div className="test-container">
                <div className="test-header">
                    {gridVisible && (
                        <div id="exampleButtons" style={{"marginBottom": "1rem"}}>
                            <button onClick={() => this.updateColumnWidth()}>Change Columns Width</button>
                            <button onClick={() => this.destroyGrid()}>Destroy Grid</button>
                        </div>
                    )}
                    {Array.isArray(columnsWidthOnPreDestroyed) && columnsWidthOnPreDestroyed.length > 0 && (
                        <div id="gridPreDestroyedState">
                            State captured on grid pre-destroyed event:<br/>
                            <strong>Column fields and widths</strong>
                            <div className="values">
                                <ul>
                                    {columnsWidthOnPreDestroyed.map((columnWidth, index) => (
                                        <li key={index}>{columnWidth.field} : {columnWidth.width}px</li>
                                    ))}
                                </ul>
                            </div>
                            <button onClick={() => this.reloadGrid()}>Reload Grid</button>
                        </div>
                    )}
                    </div>
                    <div style={{"height": "100%", "boxSizing": "border-box"}}>
                        <div
                            style={{
                                height: '100%',
                                width: '100%'
                            }}
                            className="ag-theme-alpine">
                            {gridVisible && (
                                <AgGridReact
                                    columnDefs={this.state.columnDefs}
                                    defaultColDef={this.state.defaultColDef}
                                    rowData={this.state.rowData}
                                    onGridReady={this.onGridReady}
                                    onGridPreDestroyed={this.onGridPreDestroyed}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const root = createRoot(document.getElementById('root'));
root.render(<GridExample/>);
