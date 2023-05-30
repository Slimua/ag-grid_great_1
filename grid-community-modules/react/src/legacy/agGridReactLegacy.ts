import {
    BaseComponentWrapper,
    ColumnApi,
    ComponentType,
    ComponentUtil,
    FrameworkComponentWrapper,
    Grid,
    GridApi,
    GridOptions,
    WrappableInterface, _
} from '@ag-grid-community/core';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { LegacyReactComponent } from './legacyReactComponent';
import { AgGridReactProps } from '../shared/interfaces';
import { NewReactComponent } from '../shared/newReactComponent';
import { LegacyPortalManager } from '../shared/portalManager';
import { ReactFrameworkOverrides } from '../shared/reactFrameworkOverrides';

export class AgGridReactLegacy<TData = any> extends Component<AgGridReactProps<TData>, {}> {

    private static MAX_COMPONENT_CREATION_TIME_IN_MS: number = 1000; // a second should be more than enough to instantiate a component

    static propTypes: any;

    static defaultProps = {
        legacyComponentRendering: false,
        disableStaticMarkup: false,
        maxComponentCreationTimeMs: AgGridReactLegacy.MAX_COMPONENT_CREATION_TIME_IN_MS
    };

    gridOptions!: GridOptions<TData>;

    api: GridApi<TData> | null = null;
    columnApi!: ColumnApi;

    portalManager: LegacyPortalManager;

    destroyed = false;

    protected eGridDiv!: HTMLElement;

    readonly SYNCHRONOUS_CHANGE_PROPERTIES = ['context']

    constructor(public props: AgGridReactProps<TData>) {
        super(props);

        this.portalManager = new LegacyPortalManager(this, props.componentWrappingElement, props.maxComponentCreationTimeMs);
    }

    render() {
        return React.createElement('div', {
            style: this.createStyleForDiv(),
            className: this.props.className,
            ref: (e: HTMLElement) => {
                this.eGridDiv = e;
            }
        }, this.portalManager.getPortals());
    }

    createStyleForDiv() {
        return {
            height: '100%',
            ...(this.props.containerStyle || {})
        };
    }

    componentDidMount() {
        const modules = this.props.modules || [];
        const gridParams = {
            providedBeanInstances: {
                agGridReact: this,
                frameworkComponentWrapper: new ReactFrameworkComponentWrapper(this, this.portalManager)
            },
            modules,
            frameworkOverrides: new ReactFrameworkOverrides(false)
        };

        const gridOptions = this.props.gridOptions || {};
        this.gridOptions = ComponentUtil.copyAttributesToGridOptions(gridOptions, this.props);

        this.checkForDeprecations(this.props);

        // don't need the return value
        new Grid(this.eGridDiv, this.gridOptions, gridParams);

        this.api = this.gridOptions.api!;
        this.columnApi = this.gridOptions.columnApi!;

        this.props.setGridApi!(this.api, this.columnApi);
    }

    private checkForDeprecations(props: any) {
        if (props.rowDataChangeDetectionStrategy) {
            _.doOnce(() => console.warn('AG Grid: Since v29 rowDataChangeDetectionStrategy has been deprecated. Row data property changes will be compared by reference via triple equals ===. See https://ag-grid.com/react-data-grid/react-hooks/'), 'rowDataChangeDetectionStrategy_Deprecation')
        }
    }

    shouldComponentUpdate(nextProps: any) {
        this.processPropsChanges(this.props, nextProps);

        // we want full control of the dom, as AG Grid doesn't use React internally,
        // so for performance reasons we tell React we don't need render called after
        // property changes.
        return false;
    }

    componentDidUpdate(prevProps: any) {
        this.processPropsChanges(prevProps, this.props);
    }

    processPropsChanges(prevProps: any, nextProps: any) {
        const changes = {};

        this.extractGridPropertyChanges(prevProps, nextProps, changes);

        this.processSynchronousChanges(changes);
        this.processAsynchronousChanges(changes);
    }

    private extractGridPropertyChanges(prevProps: any, nextProps: any, changes: any) {
        const debugLogging = !!nextProps.debug;

        Object.keys(nextProps).forEach(propKey => {
            if (ComponentUtil.ALL_PROPERTIES_SET.has(propKey as any)) {

                if (prevProps[propKey] !== nextProps[propKey]) {
                    if (debugLogging) {
                        console.log(`agGridReact: [${propKey}] property changed`);
                    }

                    changes[propKey] = {
                        previousValue: prevProps[propKey],
                        currentValue: nextProps[propKey]
                    };
                }
            }
        });

        ComponentUtil.EVENT_CALLBACKS.forEach(funcName => {
            if (prevProps[funcName] !== nextProps[funcName]) {
                if (debugLogging) {
                    console.log(`agGridReact: [${funcName}] event callback changed`);
                }

                changes[funcName] = {
                    previousValue: prevProps[funcName],
                    currentValue: nextProps[funcName]
                };
            }
        });
    }

    componentWillUnmount() {
        if (this.api) {
            this.api.destroy();
            this.api = null;
        }

        this.destroyed = true;
        this.portalManager.destroy();
    }

    public isDisableStaticMarkup(): boolean {
        return this.props.disableStaticMarkup === true;
    }

    public isLegacyComponentRendering(): boolean {
        return this.props.legacyComponentRendering === true;
    }

    private processSynchronousChanges(changes: any): {} {
        const asyncChanges = {...changes};
        if (Object.keys(asyncChanges).length > 0) {
            const synchronousChanges: { [key: string]: any } = {};
            this.SYNCHRONOUS_CHANGE_PROPERTIES.forEach((synchronousChangeProperty: string) => {
                if (asyncChanges[synchronousChangeProperty]) {
                    synchronousChanges[synchronousChangeProperty] = asyncChanges[synchronousChangeProperty];
                    delete asyncChanges[synchronousChangeProperty];
                }
            })

            if(Object.keys(synchronousChanges).length > 0 && !!this.api) {
                ComponentUtil.processOnChange(synchronousChanges, this.api)
            }
        }
        return asyncChanges;
    }

    private processAsynchronousChanges(changes: {}) {
        if (Object.keys(changes).length > 0) {
            window.setTimeout(() => {
                // destroyed?
                if (this.api) {
                    ComponentUtil.processOnChange(changes, this.api)
                }
            });
        }
    }
}

AgGridReactLegacy.propTypes = {
    gridOptions: PropTypes.object
};

addProperties(ComponentUtil.EVENT_CALLBACKS, PropTypes.func);
addProperties(ComponentUtil.BOOLEAN_PROPERTIES, PropTypes.bool);
addProperties(ComponentUtil.STRING_PROPERTIES, PropTypes.string);
addProperties(ComponentUtil.OBJECT_PROPERTIES, PropTypes.object);
addProperties(ComponentUtil.ARRAY_PROPERTIES, PropTypes.array);
addProperties(ComponentUtil.NUMBER_PROPERTIES, PropTypes.number);
addProperties(ComponentUtil.FUNCTION_PROPERTIES, PropTypes.func);

function addProperties(listOfProps: string[], propType: any) {
    listOfProps.forEach(propKey => {
        (AgGridReactLegacy as any)[propKey] = propType;
    });
}

class ReactFrameworkComponentWrapper extends BaseComponentWrapper<WrappableInterface> implements FrameworkComponentWrapper {

    private readonly agGridReact!: AgGridReactLegacy;
    private readonly portalManager!: LegacyPortalManager;

    constructor(agGridReact: AgGridReactLegacy, portalManager: LegacyPortalManager) {
        super();
        this.agGridReact = agGridReact;
        this.portalManager = portalManager;
    }

    createWrapper(UserReactComponent: { new(): any; }, componentType: ComponentType): WrappableInterface {
        if (this.agGridReact.isLegacyComponentRendering())  {
            return new LegacyReactComponent(UserReactComponent, this.agGridReact, this.portalManager, componentType);
        } else {
            return new NewReactComponent(UserReactComponent, this.portalManager, componentType);
        }
    }
}
