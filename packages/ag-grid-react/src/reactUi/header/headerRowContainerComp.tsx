import type { ColumnPinnedType, HeaderRowCtrl, IHeaderRowContainerComp } from 'ag-grid-community';
import { HeaderRowContainerCtrl } from 'ag-grid-community';
import React, { memo, useCallback, useContext, useRef, useState } from 'react';

import { BeansContext } from '../beansContext';
import HeaderRowComp from './headerRowComp';

const HeaderRowContainerComp = (props: { pinned: ColumnPinnedType }) => {
    const [displayed, setDisplayed] = useState<true | false>(true);
    const [headerRowCtrls, setHeaderRowCtrls] = useState<HeaderRowCtrl[]>([]);

    const { context } = useContext(BeansContext);
    const eGui = useRef<HTMLDivElement | null>(null);
    const eCenterContainer = useRef<HTMLDivElement>(null);
    const headerRowCtrlRef = useRef<HeaderRowContainerCtrl>();

    const pinnedLeft = props.pinned === 'left';
    const pinnedRight = props.pinned === 'right';
    const centre = !pinnedLeft && !pinnedRight;

    const compProxy = useRef<IHeaderRowContainerComp>({
        setDisplayed,
        setCtrls: (ctrls) => setHeaderRowCtrls(ctrls),

        // centre only
        setCenterWidth: (width) => {
            if (eCenterContainer.current) {
                eCenterContainer.current.style.width = width;
            }
        },
        setViewportScrollLeft: (left) => {
            if (eGui.current) {
                eGui.current.scrollLeft = left;
            }
        },

        // pinned only
        setPinnedContainerWidth: (width) => {
            if (eGui.current) {
                eGui.current.style.width = width;
                eGui.current.style.minWidth = width;
                eGui.current.style.maxWidth = width;
            }
        },
    });

    const setRef = useCallback((eRef: HTMLDivElement | null) => {
        eGui.current = eRef;
        headerRowCtrlRef.current = eRef
            ? context.createBean(new HeaderRowContainerCtrl(props.pinned))
            : context.destroyBean(headerRowCtrlRef.current);

        if (!eRef) {
            return;
        }

        headerRowCtrlRef.current?.setComp(compProxy.current, eRef);
    }, []);

    const className = !displayed ? 'ag-hidden' : '';

    const insertRowsJsx = () => headerRowCtrls.map((ctrl) => <HeaderRowComp ctrl={ctrl} key={ctrl.getInstanceId()} />);

    return (
        <>
            {pinnedLeft && (
                <div
                    ref={setRef}
                    className={'ag-pinned-left-header ' + className}
                    aria-hidden={!displayed}
                    role="rowgroup"
                >
                    {insertRowsJsx()}
                </div>
            )}
            {pinnedRight && (
                <div
                    ref={setRef}
                    className={'ag-pinned-right-header ' + className}
                    aria-hidden={!displayed}
                    role="rowgroup"
                >
                    {insertRowsJsx()}
                </div>
            )}
            {centre && (
                <div ref={setRef} className={'ag-header-viewport ' + className} role="presentation">
                    <div ref={eCenterContainer} className={'ag-header-container'} role="rowgroup">
                        {insertRowsJsx()}
                    </div>
                </div>
            )}
        </>
    );
};

export default memo(HeaderRowContainerComp);
