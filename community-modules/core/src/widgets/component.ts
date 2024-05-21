import { AgStackComponentsRegistry } from '../components/agStackComponentsRegistry';
import { BeanStub } from '../context/beanStub';
import { Autowired, PreConstruct } from '../context/context';
import { ColDef, ColGroupDef } from '../entities/colDef';
import { Column } from '../entities/column';
import { ColumnGroup } from '../entities/columnGroup';
import { AgEvent } from '../events';
import { WithoutGridCommon } from '../interfaces/iCommon';
import { CssClassManager } from '../rendering/cssClassManager';
import { ITooltipParams, TooltipLocation } from '../rendering/tooltipComponent';
import {
    _copyNodeList,
    _isNodeOrElement,
    _iterateNamedNodeMap,
    _loadTemplate,
    _setDisplayed,
    _setVisible,
} from '../utils/dom';
import { _getFunctionName } from '../utils/function';
import { NumberSequence } from '../utils/numberSequence';
import { TooltipFeature } from './tooltipFeature';

const compIdSequence = new NumberSequence();

export interface VisibleChangedEvent extends AgEvent {
    visible: boolean;
}

export type ComponentClass = { new (params?: any): Component; selector: AgComponentSelector };

export class Component extends BeanStub {
    public static elementGettingCreated: any;

    public static EVENT_DISPLAYED_CHANGED = 'displayedChanged';
    private eGui: HTMLElement;
    private components: ComponentClass[] = [];
    @Autowired('agStackComponentsRegistry') protected readonly agStackComponentsRegistry: AgStackComponentsRegistry;

    // if false, then CSS class "ag-hidden" is applied, which sets "display: none"
    private displayed = true;

    // if false, then CSS class "ag-invisible" is applied, which sets "visibility: hidden"
    private visible = true;

    protected parentComponent: Component | undefined;

    // unique id for this row component. this is used for getting a reference to the HTML dom.
    // we cannot use the RowNode id as this is not unique (due to animation, old rows can be lying
    // around as we create a new rowComp instance for the same row node).
    private compId = compIdSequence.next();

    private cssClassManager: CssClassManager;

    protected usingBrowserTooltips: boolean;
    private tooltipText: string | null | undefined;
    private tooltipFeature: TooltipFeature | undefined;

    constructor(template?: string, components?: ComponentClass[]) {
        super();

        this.cssClassManager = new CssClassManager(() => this.eGui);

        if (template) {
            this.components = components || [];
            this.setTemplate(template, [], undefined);
        }
    }

    @PreConstruct
    private componentPreConstruct(): void {
        this.usingBrowserTooltips = this.gos.get('enableBrowserTooltips');

        // ui exists if user sets template in constructor. when this happens, we have to wait for the context
        // to be autoWired first before we can create child components.
        if (this.getGui()) {
            this.agStackComponentsRegistry.ensureRegistered(this.components);
            this.createChildComponentsFromTags(this.getGui());
        }
    }

    public getCompId(): number {
        return this.compId;
    }

    public getTooltipParams(): WithoutGridCommon<ITooltipParams> {
        return {
            value: this.tooltipText,
            location: 'UNKNOWN',
        };
    }

    public setTooltip(params?: {
        newTooltipText?: string | null;
        showDelayOverride?: number;
        hideDelayOverride?: number;
        location?: TooltipLocation;
        getColumn?(): Column | ColumnGroup;
        getColDef?(): ColDef | ColGroupDef;
        shouldDisplayTooltip?: () => boolean;
    }): void {
        const { newTooltipText, showDelayOverride, hideDelayOverride, location, shouldDisplayTooltip } = params || {};

        if (this.tooltipFeature) {
            this.tooltipFeature = this.destroyBean(this.tooltipFeature);
        }

        if (this.tooltipText !== newTooltipText) {
            this.tooltipText = newTooltipText;
        }

        const getTooltipValue = () => this.tooltipText;

        if (newTooltipText != null) {
            this.tooltipFeature = this.createBean(
                new TooltipFeature({
                    getTooltipValue,
                    getGui: () => this.getGui(),
                    getLocation: () => location ?? 'UNKNOWN',
                    getColDef: params?.getColDef,
                    getColumn: params?.getColumn,
                    getTooltipShowDelayOverride: showDelayOverride != null ? () => showDelayOverride : undefined,
                    getTooltipHideDelayOverride: hideDelayOverride != null ? () => hideDelayOverride : undefined,
                    shouldDisplayTooltip,
                })
            );
        }
    }

    // for registered components only, eg creates AgCheckbox instance from ag-checkbox HTML tag
    private createChildComponentsFromTags(parentNode: Element, paramsMap?: { [key: string]: any }): void {
        // we MUST take a copy of the list first, as the 'swapComponentForNode' adds comments into the DOM
        // which messes up the traversal order of the children.
        const childNodeList: Node[] = _copyNodeList(parentNode.childNodes);

        childNodeList.forEach((childNode) => {
            if (!(childNode instanceof HTMLElement)) {
                return;
            }

            const childComp = this.createComponentFromElement(
                childNode,
                (childComp) => {
                    // copy over all attributes, including css classes, so any attributes user put on the tag
                    // wll be carried across
                    const childGui = childComp.getGui();
                    if (childGui) {
                        this.copyAttributesFromNode(childNode, childComp.getGui());
                    }
                },
                paramsMap
            );

            if (childComp) {
                if ((childComp as any).addItems && childNode.children.length) {
                    this.createChildComponentsFromTags(childNode, paramsMap);

                    // converting from HTMLCollection to Array
                    const items = Array.prototype.slice.call(childNode.children);

                    (childComp as any).addItems(items);
                }
                // replace the tag (eg ag-checkbox) with the proper HTMLElement (eg 'div') in the dom
                this.swapComponentForNode(childComp, parentNode, childNode);
            } else if (childNode.childNodes) {
                this.createChildComponentsFromTags(childNode, paramsMap);
            }
        });
    }

    private browserElements = new Set<string>(['DIV', 'SPAN', 'INPUT', 'TEXTAREA', 'BUTTON']);

    private createComponentFromElement(
        element: HTMLElement,
        afterPreCreateCallback?: (comp: Component) => void,
        paramsMap?: { [key: string]: any }
    ): Component | null {
        const key = element.nodeName;

        const elementRef = element.getAttribute('ref');

        const ComponentClass = this.browserElements.has(key)
            ? null
            : this.agStackComponentsRegistry.getComponent(key as Uppercase<AgComponentSelector>);
        let newComponent: Component | null = null;
        if (ComponentClass) {
            Component.elementGettingCreated = element;
            const componentParams = paramsMap ? paramsMap[elementRef!] : undefined;
            newComponent = new ComponentClass(componentParams);
            newComponent.setParentComponent(this);

            this.createBean(newComponent, null, afterPreCreateCallback);
        }

        return newComponent;
    }

    private copyAttributesFromNode(source: Element, dest: Element): void {
        _iterateNamedNodeMap(source.attributes, (name, value) => dest.setAttribute(name, value));
    }

    private swapComponentForNode(newComponent: Component, parentNode: Element, childNode: Node): void {
        const eComponent = newComponent.getGui();
        parentNode.replaceChild(eComponent, childNode);
        parentNode.insertBefore(document.createComment(childNode.nodeName), eComponent);
        this.addDestroyFunc(this.destroyBean.bind(this, newComponent));
        this.swapInComponentForQuerySelectors(newComponent, childNode);
    }

    private swapInComponentForQuerySelectors(newComponent: Component, childNode: Node): void {
        const thisNoType = this as any;

        this.iterateOverQuerySelectors((querySelector: any) => {
            if (thisNoType[querySelector.attributeName] === childNode) {
                thisNoType[querySelector.attributeName] = newComponent;
            }
        });
    }

    private iterateOverQuerySelectors(action: (querySelector: any) => void): void {
        let thisPrototype: any = Object.getPrototypeOf(this);

        while (thisPrototype != null) {
            const metaData = thisPrototype.__agComponentMetaData;
            const currentProtoName = _getFunctionName(thisPrototype.constructor);

            if (metaData && metaData[currentProtoName] && metaData[currentProtoName].querySelectors) {
                metaData[currentProtoName].querySelectors.forEach((querySelector: any) => action(querySelector));
            }

            thisPrototype = Object.getPrototypeOf(thisPrototype);
        }
    }

    protected activateTabIndex(elements?: Element[]): void {
        const tabIndex = this.gos.get('tabIndex');

        if (!elements) {
            elements = [];
        }

        if (!elements.length) {
            elements.push(this.getGui());
        }

        elements.forEach((el) => el.setAttribute('tabindex', tabIndex.toString()));
    }

    public setTemplate(
        template: string | null | undefined,
        components?: ComponentClass[],
        paramsMap?: { [key: string]: any }
    ): void {
        const eGui = _loadTemplate(template as string);
        this.setTemplateFromElement(eGui, components, paramsMap);
    }

    public setTemplateFromElement(
        element: HTMLElement,
        components?: ComponentClass[],
        paramsMap?: { [key: string]: any }
    ): void {
        this.eGui = element;
        (this.eGui as any).__agComponent = this;
        this.wireQuerySelectors();
        this.agStackComponentsRegistry?.ensureRegistered(components ?? this.components);

        // context will not be available when user sets template in constructor
        if (this.getContext()) {
            this.createChildComponentsFromTags(this.getGui(), paramsMap);
        }
    }

    protected wireQuerySelectors(): void {
        if (!this.eGui) {
            return;
        }

        const thisNoType = this as any;

        this.iterateOverQuerySelectors((querySelector: any) => {
            const setResult = (result: any) => (thisNoType[querySelector.attributeName] = result);

            // if it's a ref selector, and match is on top level component, we return
            // the element. otherwise no way of components putting ref=xxx on the top
            // level element as querySelector only looks at children.
            const topLevelRefMatch =
                querySelector.refSelector && this.getAttribute('ref') === querySelector.refSelector;
            if (topLevelRefMatch) {
                setResult(this.eGui);
            } else {
                // otherwise use querySelector, which looks at children
                const resultOfQuery = this.eGui.querySelector(querySelector.querySelector);
                if (resultOfQuery) {
                    setResult(resultOfQuery.__agComponent || resultOfQuery);
                }
            }
        });
    }

    public getGui(): HTMLElement {
        return this.eGui;
    }

    public getFocusableElement(): HTMLElement {
        return this.eGui;
    }

    public getAriaElement(): Element {
        return this.getFocusableElement();
    }

    public setParentComponent(component: Component) {
        this.parentComponent = component;
    }

    public getParentComponent(): Component | undefined {
        return this.parentComponent;
    }

    // this method is for older code, that wants to provide the gui element,
    // it is not intended for this to be in ag-Stack
    protected setGui(eGui: HTMLElement): void {
        this.eGui = eGui;
    }

    protected queryForHtmlElement(cssSelector: string): HTMLElement {
        return this.eGui.querySelector(cssSelector) as HTMLElement;
    }

    protected queryForHtmlInputElement(cssSelector: string): HTMLInputElement {
        return this.eGui.querySelector(cssSelector) as HTMLInputElement;
    }

    public appendChild(newChild: HTMLElement | Component, container?: HTMLElement): void {
        if (newChild == null) {
            return;
        }

        if (!container) {
            container = this.eGui;
        }

        if (_isNodeOrElement(newChild)) {
            container.appendChild(newChild as HTMLElement);
        } else {
            const childComponent = newChild as Component;
            container.appendChild(childComponent.getGui());
        }
    }

    public isDisplayed(): boolean {
        return this.displayed;
    }

    public setVisible(visible: boolean, options: { skipAriaHidden?: boolean } = {}): void {
        if (visible !== this.visible) {
            this.visible = visible;
            const { skipAriaHidden } = options;
            _setVisible(this.eGui, visible, { skipAriaHidden });
        }
    }

    public setDisplayed(displayed: boolean, options: { skipAriaHidden?: boolean } = {}): void {
        if (displayed !== this.displayed) {
            this.displayed = displayed;
            const { skipAriaHidden } = options;
            _setDisplayed(this.eGui, displayed, { skipAriaHidden });

            const event: VisibleChangedEvent = {
                type: Component.EVENT_DISPLAYED_CHANGED,
                visible: this.displayed,
            };

            this.dispatchEvent(event);
        }
    }

    protected destroy(): void {
        if (this.parentComponent) {
            this.parentComponent = undefined;
        }

        if (this.tooltipFeature) {
            this.tooltipFeature = this.destroyBean(this.tooltipFeature);
        }

        const eGui = this.eGui as any;

        if (eGui && eGui.__agComponent) {
            eGui.__agComponent = undefined;
        }

        super.destroy();
    }

    public addGuiEventListener(event: string, listener: (event: any) => void, options?: AddEventListenerOptions): void {
        this.eGui.addEventListener(event, listener, options);
        this.addDestroyFunc(() => this.eGui.removeEventListener(event, listener));
    }

    public addCssClass(className: string): void {
        this.cssClassManager.addCssClass(className);
    }

    public removeCssClass(className: string): void {
        this.cssClassManager.removeCssClass(className);
    }

    public containsCssClass(className: string): boolean {
        return this.cssClassManager.containsCssClass(className);
    }

    public addOrRemoveCssClass(className: string, addOrRemove: boolean): void {
        this.cssClassManager.addOrRemoveCssClass(className, addOrRemove);
    }

    public getAttribute(key: string): string | null {
        const { eGui } = this;
        return eGui ? eGui.getAttribute(key) : null;
    }

    public getRefElement(refName: string): HTMLElement {
        return this.queryForHtmlElement(`[ref="${refName}"]`);
    }
}

export type AgComponentSelector =
    | 'AG-ADVANCED-FILTER'
    | 'AG-ANGLE-SELECT'
    | 'AG-AUTOCOMPLETE'
    | 'AG-CHECKBOX'
    | 'AG-COLOR-PICKER'
    | 'AG-FAKE-HORIZONTAL-SCROLL'
    | 'AG-FAKE-VERTICAL-SCROLL'
    | 'AG-FILL-HANDLE'
    | 'AG-FILTERS-TOOL-PANEL-HEADER'
    | 'AG-FILTERS-TOOL-PANEL-LIST'
    | 'AG-GRID-BODY'
    | 'AG-GRID-HEADER-DROP-ZONES'
    | 'AG-GROUP-COMPONENT'
    | 'AG-HEADER-ROOT'
    | 'AG-HORIZONTAL-RESIZE'
    | 'AG-INPUT-DATE-FIELD'
    | 'AG-INPUT-NUMBER-FIELD'
    | 'AG-INPUT-RANGE'
    | 'AG-INPUT-TEXT-AREA'
    | 'AG-INPUT-TEXT-FIELD'
    | 'AG-NAME-VALUE'
    | 'AG-OVERLAY-WRAPPER'
    | 'AG-PAGE-SIZE-SELECTOR'
    | 'AG-PAGINATION'
    | 'AG-PRIMARY-COLS-HEADER'
    | 'AG-PRIMARY-COLS-LIST'
    | 'AG-PRIMARY-COLS'
    | 'AG-RADIO-BUTTON'
    | 'AG-RANGE-HANDLE'
    | 'AG-ROW-CONTAINER'
    | 'AG-SELECT'
    | 'AG-SIDE-BAR'
    | 'AG-SIDE-BAR-BUTTONS'
    | 'AG-SLIDER'
    | 'AG-SORT-INDICATOR'
    | 'AG-STATUS-BAR'
    | 'AG-TOGGLE-BUTTON'
    | 'AG-WATERMARK';
