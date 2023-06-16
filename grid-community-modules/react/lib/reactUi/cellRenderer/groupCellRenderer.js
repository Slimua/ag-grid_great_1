// @ag-grid-community/react v30.0.1
import { GroupCellRendererCtrl, _ } from "@ag-grid-community/core";
import React, { useContext, useImperativeHandle, forwardRef, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { BeansContext } from "../beansContext";
import { showJsComp } from "../jsComp";
import { useLayoutEffectOnce } from "../useEffectOnce";
import { CssClasses } from "../utils";
const GroupCellRenderer = forwardRef((props, ref) => {
    const context = useContext(BeansContext).context;
    const eGui = useRef(null);
    const eValueRef = useRef(null);
    const eCheckboxRef = useRef(null);
    const eExpandedRef = useRef(null);
    const eContractedRef = useRef(null);
    const [innerCompDetails, setInnerCompDetails] = useState();
    const [childCount, setChildCount] = useState();
    const [value, setValue] = useState();
    const [cssClasses, setCssClasses] = useState(new CssClasses());
    const [expandedCssClasses, setExpandedCssClasses] = useState(new CssClasses('ag-hidden'));
    const [contractedCssClasses, setContractedCssClasses] = useState(new CssClasses('ag-hidden'));
    const [checkboxCssClasses, setCheckboxCssClasses] = useState(new CssClasses('ag-invisible'));
    useImperativeHandle(ref, () => {
        return {
            // force new instance when grid tries to refresh
            refresh() { return false; }
        };
    });
    useLayoutEffect(() => {
        return showJsComp(innerCompDetails, context, eValueRef.current);
    }, [innerCompDetails]);
    useLayoutEffectOnce(() => {
        const compProxy = {
            setInnerRenderer: (details, valueToDisplay) => {
                setInnerCompDetails(details);
                setValue(valueToDisplay);
            },
            setChildCount: count => setChildCount(count),
            addOrRemoveCssClass: (name, on) => setCssClasses(prev => prev.setClass(name, on)),
            setContractedDisplayed: displayed => setContractedCssClasses(prev => prev.setClass('ag-hidden', !displayed)),
            setExpandedDisplayed: displayed => setExpandedCssClasses(prev => prev.setClass('ag-hidden', !displayed)),
            setCheckboxVisible: visible => setCheckboxCssClasses(prev => prev.setClass('ag-invisible', !visible))
        };
        const ctrl = context.createBean(new GroupCellRendererCtrl());
        ctrl.init(compProxy, eGui.current, eCheckboxRef.current, eExpandedRef.current, eContractedRef.current, GroupCellRenderer, props);
        return () => { context.destroyBean(ctrl); };
    });
    const className = useMemo(() => `ag-cell-wrapper ${cssClasses.toString()}`, [cssClasses]);
    const expandedClassName = useMemo(() => `ag-group-expanded ${expandedCssClasses.toString()}`, [expandedCssClasses]);
    const contractedClassName = useMemo(() => `ag-group-contracted ${contractedCssClasses.toString()}`, [contractedCssClasses]);
    const checkboxClassName = useMemo(() => `ag-group-checkbox ${checkboxCssClasses.toString()}`, [checkboxCssClasses]);
    const useFwRenderer = innerCompDetails && innerCompDetails.componentFromFramework;
    const FwRenderer = useFwRenderer ? innerCompDetails.componentClass : undefined;
    const useValue = innerCompDetails == null && value != null;
    const escapedValue = _.escapeString(value, true);
    return (React.createElement("span", Object.assign({ className: className, ref: eGui }, (!props.colDef ? { role: 'gridcell' } : {})),
        React.createElement("span", { className: expandedClassName, ref: eExpandedRef }),
        React.createElement("span", { className: contractedClassName, ref: eContractedRef }),
        React.createElement("span", { className: checkboxClassName, ref: eCheckboxRef }),
        React.createElement("span", { className: "ag-group-value", ref: eValueRef },
            useValue && React.createElement(React.Fragment, null, escapedValue),
            useFwRenderer && React.createElement(FwRenderer, Object.assign({}, innerCompDetails.params))),
        React.createElement("span", { className: "ag-group-child-count" }, childCount)));
});
// we do not memo() here, as it would stop the forwardRef working
export default GroupCellRenderer;

//# sourceMappingURL=groupCellRenderer.js.map
