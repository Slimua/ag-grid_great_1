import { _errorOnce, _warnOnce } from '@ag-grid-community/core';

import type { Param, ParamTypes } from './GENERATED-param-types';
import { coreCSS, coreDefaults } from './parts/core/core-part';
import type { CoreParam } from './parts/core/core-part';
import { paramValueToCss } from './theme-types';
import type { CssFragment, ParamDefaults, ThemeInstallArgs, ThemeRenderArgs } from './theme-types';
import { paramToVariableName } from './theme-utils';

export class ThemeUnit<T extends Param = never> {
    constructor(
        readonly group: string,
        readonly variant: string,
        readonly dependencies: readonly ThemeUnit[] = [],
        readonly defaults: Readonly<ParamDefaults<T>> = {} as any,
        readonly css: ReadonlyArray<CssFragment> = []
    ) {}

    get id(): string {
        return `${this.group}/${this.variant}`;
    }

    usePart<D extends Param>(part: ThemeUnit<D>): ThemeUnit<T | D> {
        return new ThemeUnit(this.group, this.variant, this.dependencies.concat(part), this.defaults, this.css) as any;
    }

    overrideParams(params: Partial<Pick<ParamTypes, T | CoreParam>>): this {
        return new ThemeUnit(
            this.group,
            this.variant,
            this.dependencies,
            { ...this.defaults, ...params } as any,
            this.css
        ) as any;
    }

    addCss(css: CssFragment): ThemeUnit<T> {
        return new ThemeUnit(this.group, this.variant, this.dependencies, this.defaults, this.css.concat(css));
    }

    createVariant(variant: string): ThemeUnit<T> {
        return new ThemeUnit(this.group, variant, this.dependencies, this.defaults, this.css);
    }

    addParams<A extends Param>(defaults: Pick<ParamTypes, A>): ThemeUnit<T | A> {
        return this.overrideParams(defaults as any) as any;
    }

    getCSS(args: ThemeRenderArgs): string {
        return this._getCSSChunks(args, 'getCSS')
            .map((chunk) => chunk.css)
            .join('\n\n');
    }

    async install(args: ThemeInstallArgs = {}) {
        if (this.group !== 'theme') {
            throw new Error(`${this.id} can't be installed directly, it must be used by a theme instead`);
        }

        let container = args.container || null;
        const loadPromises: Promise<void>[] = [];
        if (!container) {
            container = document.querySelector('head');
            if (!container) throw new Error("Can't install theme before document head is created");
        }
        const chunks = this._getCSSChunks(args, 'install');
        const activeChunkIds = new Set(chunks.map((chunk) => chunk.id));
        const existingStyles = Array.from(
            container.querySelectorAll(':scope > [data-ag-injected-style-id]')
        ) as AnnotatedStyleElement[];
        existingStyles.forEach((style) => {
            if (!activeChunkIds.has(style.dataset.agInjectedStyleId!)) {
                style.remove();
            }
        });
        for (const chunk of chunks) {
            let style = existingStyles.find((s) => s.dataset.agInjectedStyleId === chunk.id);
            if (!style) {
                style = document.createElement('style');
                style.dataset.agInjectedStyleId = chunk.id;
                const lastExistingStyle = existingStyles[existingStyles.length - 1];
                container.insertBefore(style, lastExistingStyle?.nextSibling || null);
            }
            if (style._agTextContent !== chunk.css) {
                style.textContent = chunk.css;
                style._agTextContent = chunk.css;
                loadPromises.push(resolveOnLoad(style));
            }
        }

        await Promise.all(loadPromises);
    }

    private _getParamsCache?: Partial<ParamTypes>;
    public getParams(): Partial<ParamTypes> {
        if (this._getParamsCache) return this._getParamsCache;

        const mergedParams: any = { ...coreDefaults };
        for (const part of this._getFlatUnits()) {
            Object.assign(mergedParams, part.defaults);
        }

        return (this._getParamsCache = mergedParams);
    }

    private _getFlatUnitsCache?: ThemeUnit[];
    private _getFlatUnits(): ThemeUnit[] {
        if (this._getFlatUnitsCache) return this._getFlatUnitsCache;

        const visit = (part: ThemeUnit, accumulator: Record<string, ThemeUnit>) => {
            for (const dep of part.dependencies) {
                visit(dep, accumulator);
            }
            // remove any existing item before overwriting, so that the newly added
            // part is ordered at the end of the list
            delete accumulator[part.group];
            accumulator[part.group] = part;
        };

        const accumulator: Record<string, ThemeUnit> = {};
        visit(this, accumulator);
        return (this._getFlatUnitsCache = Object.values(accumulator));
    }

    private _getCssChunksCache?: ThemeCssChunk[];
    private _getCSSChunks({ loadGoogleFonts }: ThemeRenderArgs, method: string): ThemeCssChunk[] {
        if (this._getCssChunksCache) return this._getCssChunksCache;

        const chunks: ThemeCssChunk[] = [];

        const googleFontsChunk = makeGoogleFontsChunk(this);
        if (googleFontsChunk) {
            if (loadGoogleFonts) {
                chunks.push(googleFontsChunk);
            } else if (loadGoogleFonts == null) {
                getGoogleFontsUsed(this).forEach((font) =>
                    _warnOnce(
                        `${this.id} uses google font ${font} but no value for loadGoogleFonts was passed to theme.${method}(). Pass true to load fonts from ${googleFontsDomain} or false to silence this warning.`
                    )
                );
            }
        }

        chunks.push(makeVariablesChunk(this));

        chunks.push({ id: 'core', css: coreCSS() });

        for (const part of this._getFlatUnits()) {
            if (part.css.length > 0) {
                let css = `/* Part ${part.id} */`;
                css += part.css.map((p) => (typeof p === 'function' ? p() : p)).join('\n') + '\n';
                chunks.push({ css, id: part.id });
            }
        }

        return (this._getCssChunksCache = chunks);
    }
}

const makeVariablesChunk = (theme: ThemeUnit): ThemeCssChunk => {
    let variablesCss = '';
    let inheritanceCss = '';
    const renderedParams: Record<string, string> = {};
    for (const [name, value] of Object.entries(theme.getParams())) {
        const rendered = paramValueToCss(name, value);
        if (rendered === false) {
            _errorOnce(`Invalid value for param ${name} - ${describeValue(value)}`);
        } else if (rendered) {
            renderedParams[name] = rendered;
        }
    }
    for (const [name, defaultValue] of Object.entries(renderedParams)) {
        const variable = paramToVariableName(name);
        const inheritedVariable = variable.replace('--ag-', '--ag-inherited-');
        variablesCss += `\t${variable}: var(${inheritedVariable}, ${defaultValue});\n`;
        inheritanceCss += `\t${inheritedVariable}: var(${variable});\n`;
    }
    let css = `.ag-root-wrapper, .ag-measurement-container, .ag-apply-theme-variables {\n${variablesCss}}\n`;
    css += `:has(> .ag-root-wrapper), :has(> .ag-measurement-container), :has(> .ag-apply-theme-variables) {\n${inheritanceCss}}\n`;
    return {
        css,
        id: 'variables',
    };
};

const getGoogleFontsUsed = (theme: ThemeUnit): string[] => {
    const googleFonts = new Set<string>();
    for (const value of Object.values(theme.getParams())) {
        const potentialFonts: any[] = value ? (Array.isArray(value) ? value : [value]) : [];
        for (const potentialFont of potentialFonts) {
            const googleFont = potentialFont?.googleFont;
            if (typeof googleFont === 'string') {
                googleFonts.add(googleFont);
            }
        }
    }
    return Array.from(googleFonts).sort();
};

const makeGoogleFontsChunk = (theme: ThemeUnit): ThemeCssChunk | null => {
    const googleFonts = getGoogleFontsUsed(theme);
    return googleFonts.length > 0
        ? {
              id: 'googleFonts',
              css: googleFonts
                  .sort()
                  .map((font) => {
                      return `@import url('https://${googleFontsDomain}/css2?family=${encodeURIComponent(font)}:wght@100;200;300;400;500;600;700;800;900&display=swap');\n`;
                  })
                  .join(''),
          }
        : null;
};

const googleFontsDomain = 'fonts.googleapis.com';

const resolveOnLoad = (element: HTMLStyleElement) =>
    new Promise<void>((resolve) => {
        const handler = () => {
            element.removeEventListener('load', handler);
            resolve();
        };
        element.addEventListener('load', handler);
    });

type ThemeCssChunk = {
    css: string;
    id: string;
};

type AnnotatedStyleElement = HTMLStyleElement & {
    _agTextContent?: string;
};

const describeValue = (value: any): string => {
    if (value == null) return String(value);
    return `${typeof value} ${value}`;
};
