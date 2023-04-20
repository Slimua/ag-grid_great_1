import ReactDOM, { flushSync } from "react-dom";

export const classesList = (...list: (string | null | undefined)[]): string => {
    const filtered = list.filter( s => s != null && s !== '');

    return filtered.join(' ');
}

export class CssClasses {

    private classesMap: {[name: string]: boolean} = {};

    constructor(...initialClasses: string[]) {
        initialClasses.forEach(className => {
            this.classesMap[className] = true;
        });
    }

    public setClass(className: string, on: boolean): CssClasses {
        // important to not make a copy if nothing has changed, so react
        // won't trigger a render cycle on new object instance
        const nothingHasChanged = !!this.classesMap[className] == on;
        if (nothingHasChanged) { return this; }

        const res = new CssClasses();
        res.classesMap = {...this.classesMap};
        res.classesMap[className] = on;
        return res;
    }

    public toString(): string {
        const res = Object.keys(this.classesMap).filter(key => this.classesMap[key]).join(' ');
        return res;
    }

}

export const isComponentStateless = (Component: any) => {
    const hasSymbol = () => typeof Symbol === 'function' && Symbol.for;
    const getMemoType = () => hasSymbol() ? Symbol.for('react.memo') : 0xead3;

    return (
            typeof Component === 'function' && !(Component.prototype && Component.prototype.isReactComponent)
        ) || (typeof Component === 'object' && Component.$$typeof === getMemoType());
}

// CreateRoot is only available from React 18, which if used requires us to use flushSync.
const createRootAndFlushSyncAvailable = (ReactDOM as any).createRoot != null && (ReactDOM as any).flushSync != null;

/**
 * Wrapper around flushSync to provide backwards compatibility with React 16-17
 * @param fn 
 */
export const agFlushSync = (fn: () => void) => {
    if (createRootAndFlushSyncAvailable) {
        flushSync(fn);
    } else {
        fn();
    }
}