import type { BeanCollection } from '../context/context';
import { Events } from '../eventKeys';
import type { BodyScrollEvent } from '../events';
import type { AnimationFrameService } from '../misc/animationFrameService';
import { _isIOSUserAgent, _isInvisibleScrollbar, _isMacOsUserAgent } from '../utils/browser';
import { _isVisible } from '../utils/dom';
import { _waitUntil } from '../utils/function';
import { Component, RefPlaceholder } from '../widgets/component';

export abstract class AbstractFakeScrollComp extends Component {
    private animationFrameService: AnimationFrameService;

    public wireBeans(beans: BeanCollection): void {
        super.wireBeans(beans);
        this.animationFrameService = beans.animationFrameService;
    }

    protected readonly eViewport: HTMLElement = RefPlaceholder;
    protected readonly eContainer: HTMLElement = RefPlaceholder;

    protected invisibleScrollbar: boolean;
    protected hideTimeout: number | null = null;

    protected abstract setScrollVisible(): void;
    public abstract getScrollPosition(): number;
    public abstract setScrollPosition(value: number): void;

    constructor(
        template: string,
        private readonly direction: 'horizontal' | 'vertical'
    ) {
        super();
        this.setTemplate(template);
    }

    public postConstruct(): void {
        this.addManagedListener(
            this.eventService,
            Events.EVENT_SCROLL_VISIBILITY_CHANGED,
            this.onScrollVisibilityChanged.bind(this)
        );
        this.onScrollVisibilityChanged();
        this.addOrRemoveCssClass('ag-apple-scrollbar', _isMacOsUserAgent() || _isIOSUserAgent());
    }

    protected initialiseInvisibleScrollbar(): void {
        if (this.invisibleScrollbar !== undefined) {
            return;
        }

        this.invisibleScrollbar = _isInvisibleScrollbar();

        if (this.invisibleScrollbar) {
            this.hideAndShowInvisibleScrollAsNeeded();
            this.addActiveListenerToggles();
        }
    }

    protected addActiveListenerToggles(): void {
        const activateEvents = ['mouseenter', 'mousedown', 'touchstart'];
        const deactivateEvents = ['mouseleave', 'touchend'];
        const eGui = this.getGui();

        activateEvents.forEach((eventName) =>
            this.addManagedListener(eGui, eventName, () => this.addOrRemoveCssClass('ag-scrollbar-active', true))
        );
        deactivateEvents.forEach((eventName) =>
            this.addManagedListener(eGui, eventName, () => this.addOrRemoveCssClass('ag-scrollbar-active', false))
        );
    }

    protected onScrollVisibilityChanged(): void {
        // initialiseInvisibleScrollbar should only be called once, but the reason
        // this can't be inside `setComp` or `postConstruct` is the DOM might not
        // be ready, so we call it until eventually, it gets calculated.
        if (this.invisibleScrollbar === undefined) {
            this.initialiseInvisibleScrollbar();
        }

        this.animationFrameService.requestAnimationFrame(() => this.setScrollVisible());
    }

    protected hideAndShowInvisibleScrollAsNeeded(): void {
        this.addManagedListener(this.eventService, Events.EVENT_BODY_SCROLL, (params: BodyScrollEvent) => {
            if (params.direction === this.direction) {
                if (this.hideTimeout !== null) {
                    window.clearTimeout(this.hideTimeout);
                    this.hideTimeout = null;
                }
                this.addOrRemoveCssClass('ag-scrollbar-scrolling', true);
            }
        });
        this.addManagedListener(this.eventService, Events.EVENT_BODY_SCROLL_END, () => {
            this.hideTimeout = window.setTimeout(() => {
                this.addOrRemoveCssClass('ag-scrollbar-scrolling', false);
                this.hideTimeout = null;
            }, 400);
        });
    }

    protected attemptSettingScrollPosition(value: number) {
        const viewport = this.getViewport();
        _waitUntil(
            () => _isVisible(viewport),
            () => this.setScrollPosition(value),
            100
        );
    }

    protected getViewport(): HTMLElement {
        return this.eViewport;
    }

    public getContainer(): HTMLElement {
        return this.eContainer;
    }

    public onScrollCallback(fn: () => void): void {
        this.addManagedListener(this.getViewport(), 'scroll', fn);
    }
}
