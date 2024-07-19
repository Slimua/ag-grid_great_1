import type {
    HeaderGroupCellCtrl,
    IHeaderGroupCellComp,
    IHeaderGroupComp,
    UserCompDetails,
} from '@ag-grid-community/core';
import { EmptyBean } from '@ag-grid-community/core';
import React, { memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { BeansContext } from '../beansContext';
import { showJsComp } from '../jsComp';
import { CssClasses, isComponentStateless } from '../utils';

const HeaderGroupCellComp = (props: { ctrl: HeaderGroupCellCtrl }) => {
    const { context } = useContext(BeansContext);
    const { ctrl } = props;

    const [cssClasses, setCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [cssResizableClasses, setResizableCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [resizableAriaHidden, setResizableAriaHidden] = useState<'true' | 'false'>('false');
    const [ariaExpanded, setAriaExpanded] = useState<'true' | 'false' | undefined>();
    const [userCompDetails, setUserCompDetails] = useState<UserCompDetails>();
    const colId = useMemo(() => ctrl.getColId(), []);

    const compBean = useRef<EmptyBean>();
    const eGui = useRef<HTMLDivElement | null>(null);
    const eResize = useRef<HTMLDivElement>(null);
    const userCompRef = useRef<IHeaderGroupComp>();
    const compProxy = useRef<IHeaderGroupCellComp>({
        setWidth: (width: string) => {
            if (eGui.current) {
                eGui.current.style.width = width;
            }
        },
        addOrRemoveCssClass: (name: string, on: boolean) => setCssClasses((prev) => prev.setClass(name, on)),
        setUserCompDetails: (compDetails: UserCompDetails) => setUserCompDetails(compDetails),
        setResizableDisplayed: (displayed: boolean) => {
            setResizableCssClasses((prev) => prev.setClass('ag-hidden', !displayed));
            setResizableAriaHidden(!displayed ? 'true' : 'false');
        },
        setAriaExpanded: (expanded: 'true' | 'false' | undefined) => setAriaExpanded(expanded),
        getUserCompInstance: () => userCompRef.current || undefined,
    });

    const setRef = useCallback((eRef: HTMLDivElement | null) => {
        eGui.current = eRef;
        compBean.current = eRef ? context.createBean(new EmptyBean()) : context.destroyBean(compBean.current);

        if (!eRef || !props.ctrl.isAlive()) {
            return;
        }

        ctrl.setComp(compProxy.current, eRef, eResize.current!, compBean.current!);
    }, []);

    // js comps
    useLayoutEffect(() => showJsComp(userCompDetails, context, eGui.current!), [userCompDetails]);

    // add drag handling, must be done after component is added to the dom
    useEffect(() => {
        if (eGui.current) {
            ctrl.setDragSource(eGui.current);
        }
    }, [userCompDetails]);

    const userCompStateless = useMemo(() => {
        const res = userCompDetails?.componentFromFramework && isComponentStateless(userCompDetails.componentClass);
        return !!res;
    }, [userCompDetails]);

    const className = useMemo(() => 'ag-header-group-cell ' + cssClasses.toString(), [cssClasses]);
    const resizableClassName = useMemo(
        () => 'ag-header-cell-resize ' + cssResizableClasses.toString(),
        [cssResizableClasses]
    );

    const reactUserComp = userCompDetails && userCompDetails.componentFromFramework;
    const UserCompClass = userCompDetails && userCompDetails.componentClass;

    return (
        <div ref={setRef} className={className} col-id={colId} role="columnheader" aria-expanded={ariaExpanded}>
            {reactUserComp && userCompStateless && <UserCompClass {...userCompDetails!.params} />}
            {reactUserComp && !userCompStateless && <UserCompClass {...userCompDetails!.params} ref={userCompRef} />}
            <div ref={eResize} aria-hidden={resizableAriaHidden} className={resizableClassName}></div>
        </div>
    );
};

export default memo(HeaderGroupCellComp);
