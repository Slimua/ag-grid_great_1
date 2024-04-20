import { Provider, createStore } from 'jotai';
import { useLayoutEffect, useMemo, useState } from 'react';

import { RootContainer } from './components/general/RootContainer';
import { applyPreset, darkModePreset, lightModePreset } from './components/presets/presets';
import { allParamModels } from './model/ParamModel';
import { allPartModels } from './model/PartModel';
import { addChangedModelItem, getChangedModelItemCount } from './model/changed-model-items';
import { rerenderTheme } from './model/rendered-theme';

export const ThemeBuilder = () => {
    const store = useMemo(createStore, []);

    (window as any).handlePartsCssChange = () => {
        rerenderTheme(store);
    };

    const [initialised, setInitialised] = useState(false);

    useLayoutEffect(() => {
        const hasChanges = getChangedModelItemCount(store) !== 0;
        if (!hasChanges) {
            const isDarkMode = document.documentElement.dataset.darkMode === 'true';
            applyPreset(store, isDarkMode ? darkModePreset : lightModePreset);
        }

        const detectChange = (name: string) => {
            addChangedModelItem(store, name);
        };
        const listeners = [
            ...allParamModels().map((param) => store.sub(param.valueAtom, () => detectChange(param.property))),
            ...allPartModels().map((part) => store.sub(part.variantAtom, () => detectChange(part.partId))),
        ];

        if (!initialised) {
            setInitialised(true);
        }
        return () => listeners.forEach((listener) => listener());
    }, []);

    return <Provider store={store}>{initialised && <RootContainer />}</Provider>;
};
