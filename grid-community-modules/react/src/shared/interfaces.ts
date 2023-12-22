import {
    ColumnApi,
    GridApi,
    GridOptions,
    ICellEditor,
    ICellRenderer,
    IDate,
    IFilter,
    IFloatingFilter,
    IHeader,
    IHeaderGroup,
    IStatusPanel,
    IToolPanel,
    Module
} from '@ag-grid-community/core';

/** @deprecated v29 ChangeDetectionStrategyType has been deprecated. IdentityCheck will always be used now for a more consistent approach. */
export enum ChangeDetectionStrategyType {
    IdentityCheck = 'IdentityCheck',
    DeepValueCheck = 'DeepValueCheck',
    NoCheck = 'NoCheck'
}

export interface SharedProps<TData = any> extends GridOptions<TData> {
    gridOptions?: GridOptions<TData>;
    /**
     * Used to register AG Grid Modules directly with this instance of the grid. 
     * See [Providing Modules To Individual Grids](https://www.ag-grid.com/react-data-grid/modules/#providing-modules-to-individual-grids) for more information. 
     */
    modules?: Module[];
    containerStyle?: any;
    className?: string;
    setGridApi?: (gridApi: GridApi<TData>, columnApi: ColumnApi) => void;
    componentWrappingElement?: string; // only used when putting React into JS
    maxComponentCreationTimeMs?: number; // only used when putting React into JS
    children?: any;
}

export interface AgReactUiProps<TData = any> extends SharedProps<TData> {
}

/** @deprecated v31.1 Use `AgReactUiProps` instead. */
export interface AgGridReactProps<TData = any> extends SharedProps<TData> {
    /** @deprecated v31.1 No longer used. */
    disableStaticMarkup?: boolean;
    /** @deprecated v31.1 No longer used. */
    legacyComponentRendering?: boolean,
}

export interface AgReactComponent {
    /** @deprecated v31.1 Applying styling directly to `.ag-react-container` if needed */
    getReactContainerStyle?: () => {};
    /** @deprecated v31.1 Applying styling directly to `.ag-react-container` if needed */
    getReactContainerClasses?: () => string[];
}

/** @deprecated v31.1 Use `IHeaderGroup` instead. */
export interface IHeaderGroupReactComp extends IHeaderGroup, AgReactComponent {
}

/** @deprecated v31.1 Use `IHeader` instead. */
export interface IHeaderReactComp extends IHeader, AgReactComponent {
}

/** @deprecated v31.1 Use `IDate` instead. */
export interface IDateReactComp extends IDate, AgReactComponent {
}

/** @deprecated v31.1 Use `IFilter` instead. */
export interface IFilterReactComp extends IFilter, AgReactComponent {
}

/** @deprecated v31.1 Use `IFloatingFilter` instead. */
export interface IFloatingFilterReactComp extends IFloatingFilter, AgReactComponent {
}

/** @deprecated v31.1 Use `ICellRenderer` instead. */
export interface ICellRendererReactComp extends ICellRenderer, AgReactComponent {
}

/** @deprecated v31.1 Use `ICellEditor` instead. */
export interface ICellEditorReactComp extends ICellEditor, AgReactComponent {
}

/** @deprecated v31.1 No interface required. */
export interface ILoadingCellRendererReactComp extends AgReactComponent {
}

/** @deprecated v31.1 No interface required. */
export interface ILoadingOverlayReactComp extends AgReactComponent {
}

/** @deprecated v31.1 No interface required. */
export interface INoRowsOverlayReactComp extends AgReactComponent {
}

/** @deprecated v31.1 Use `IStatusPanel` instead. */
export interface IStatusPanelReactComp extends IStatusPanel, AgReactComponent {
}

/** @deprecated v31.1 Use `IToolPanel` instead. */
export interface IToolPanelReactComp extends IToolPanel, AgReactComponent {
}

// /** @deprecated v31.1 No interface required. */
export interface ITooltipReactComp extends AgReactComponent {
}
