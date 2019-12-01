import React, {Component} from 'react';
import * as PropTypes from "prop-types";
import {connect} from "react-redux";
import {bindActionCreators} from 'redux';
import {AgGridReact} from "@ag-grid-community/react";
import {actions} from './actions/fileActions.jsx'

import {AllModules} from "@ag-grid-enterprise/all-modules";

import "@ag-grid-community/all-modules/dist/styles/ag-grid.css";
import "@ag-grid-community/all-modules/dist/styles/ag-theme-balham.css";

import FileCellRenderer from './FileCellRenderer.jsx';

class FileBrowser extends Component {

  colDefs = [{field: "dateModified"}, {field: "size"}];

  autoGroupColumnDef = {
    headerName: "Files",
    rowDrag: true,
    sort: 'asc',
    width: 250,
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: "fileCellRenderer"
    }
  };

  modules = AllModules;

  frameworkComponents = {
    fileCellRenderer: FileCellRenderer
  };

  render() {
    return (
      <div style={{height: '100%'}} className="ag-theme-balham">
        <AgGridReact
          columnDefs={this.colDefs}
          rowData={this.props.files}
          treeData={true}
          groupDefaultExpanded={-1}
          getDataPath={data => data.filePath}
          autoGroupColumnDef={this.autoGroupColumnDef}
          onGridReady={params => params.api.sizeColumnsToFit()}
          getContextMenuItems={this.getContextMenuItems}
          deltaRowDataMode={true}
          modules={this.modules}
          getRowNodeId={data => data.id}
          onRowDragEnd={this.onRowDragEnd}
          frameworkComponents={this.frameworkComponents}
        >
        </AgGridReact>
      </div>
    )
  }

  onRowDragEnd = (event) => {
    if(event.overNode.data.file) return;

    let movingFilePath = event.node.data.filePath;
    let targetPath = event.overNode.data.filePath;

    this.props.actions.moveFiles(movingFilePath, targetPath);
  };

  getContextMenuItems = (params) => {
    if (!params.node) return [];
    let filePath = params.node.data ? params.node.data.filePath : [];

    let deleteItem = {
      name: "Delete",
      action: () => this.props.actions.deleteFiles(filePath)
    };

    let newItem = {
      name: "New",
      action: () => this.props.actions.newFile(filePath)
    };

    return params.node.data.file ? [deleteItem] : [newItem, deleteItem];
  };
}

FileBrowser.contextTypes = {
    store: PropTypes.object                         // must be supplied when using redux with AgGridReact
};

const mapStateToProps = (state) => ({files: state.files});
const mapDispatchToProps = (dispatch) => ({actions: bindActionCreators(actions, dispatch)});

export default connect(mapStateToProps, mapDispatchToProps)(FileBrowser);
