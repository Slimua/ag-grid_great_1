import type { Component } from '@ag-grid-community/core';
import {
    BeanStub,
    KeyCode,
    PostConstruct,
    _isStopPropagationForAgGrid,
    _stopPropagationForAgGrid,
} from '@ag-grid-community/core';

export class AdvancedFilterBuilderItemNavigationFeature extends BeanStub {
    constructor(
        private readonly eGui: HTMLElement,
        private readonly focusWrapper: HTMLElement,
        private readonly eFocusableComp: Component
    ) {
        super();
    }

    @PostConstruct
    private postConstruct(): void {
        this.addManagedListener(this.eGui, 'keydown', (event: KeyboardEvent) => {
            switch (event.key) {
                case KeyCode.TAB:
                    if (!event.defaultPrevented) {
                        // tab guard handled the navigation. stop from reaching virtual list
                        _stopPropagationForAgGrid(event);
                    }
                    break;
                case KeyCode.UP:
                case KeyCode.DOWN:
                    // if this hasn't been handled by an editor, prevent virtual list navigation
                    _stopPropagationForAgGrid(event);
                    break;
                case KeyCode.ESCAPE:
                    if (_isStopPropagationForAgGrid(event)) {
                        return;
                    }
                    if (this.eGui.contains(this.gos.getActiveDomElement())) {
                        event.preventDefault();
                        _stopPropagationForAgGrid(event);
                        this.focusWrapper.focus();
                    }
                    break;
            }
        });
        this.addManagedListener(this.focusWrapper, 'keydown', (event: KeyboardEvent) => {
            switch (event.key) {
                case KeyCode.ENTER:
                    if (_isStopPropagationForAgGrid(event)) {
                        return;
                    }
                    if (this.gos.getActiveDomElement() === this.focusWrapper) {
                        event.preventDefault();
                        _stopPropagationForAgGrid(event);
                        this.eFocusableComp.getFocusableElement().focus();
                    }
                    break;
            }
        });
        this.addManagedListener(this.focusWrapper, 'focusin', () => {
            this.focusWrapper.classList.add('ag-advanced-filter-builder-virtual-list-item-highlight');
        });
        this.addManagedListener(this.focusWrapper, 'focusout', (event: FocusEvent) => {
            if (!this.focusWrapper.contains(event.relatedTarget as HTMLElement)) {
                this.focusWrapper.classList.remove('ag-advanced-filter-builder-virtual-list-item-highlight');
            }
        });
    }
}
