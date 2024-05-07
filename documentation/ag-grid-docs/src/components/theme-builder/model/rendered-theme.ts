import type { GridApi } from '@ag-grid-community/core';
import { Theme, inputStyleBordered, tabStyleQuartz } from '@ag-grid-community/theming';
import { atom, useAtomValue, useSetAtom } from 'jotai';

import { allParamModels } from './ParamModel';
import { PartModel } from './PartModel';
import type { Store } from './store';

const changeDetection = atom(0);

export const rerenderTheme = (store: Store) => {
    store.set(changeDetection, (n) => n + 1);
};

const previewGridContainer = atom<HTMLDivElement | null>(null);
export const useSetPreviewGridContainer = () => useSetAtom(previewGridContainer);

const previewGridApi = atom<GridApi | null>(null);
export const useSetPreviewGridApi = () => useSetAtom(previewGridApi);

export const renderedThemeAtom = atom((get): Theme => {
    get(changeDetection);

    document.body.classList.add('ag-theme-custom');

    const params = Object.fromEntries(allParamModels().map((param) => [param.property, get(param.valueAtom)]));

    const iconSet = get(PartModel.for('iconSet').variantAtom).variant;

    const theme = new Theme({
        parts: [iconSet, tabStyleQuartz, inputStyleBordered],
        params,
    });

    const container = get(previewGridContainer);
    if (container) {
        const api: any = get(previewGridApi);
        theme.install({ container }).then(() => {
            if (api && !api.destroyCalled) {
                // TODO this is a hack to force the grid to recalculate its
                // sizes, we should add a public API for this
                api.gos.environment.calculatedSizes = {};
                api.eventService.dispatchEvent({ type: 'gridStylesChanged' });
            }
        });
    }

    // also install the theme at the top level, as its variables are used in UI controls
    theme.install();

    return theme;
});

export const useRenderedTheme = () => useAtomValue(renderedThemeAtom);
