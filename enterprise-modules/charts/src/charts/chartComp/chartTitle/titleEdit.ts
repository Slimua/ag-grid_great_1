import type { BeanCollection } from '@ag-grid-community/core';
import { Component } from '@ag-grid-community/core';

import type { ChartController } from '../chartController';
import type { ChartMenu } from '../menu/chartMenu';
import type { ChartMenuContext } from '../menu/chartMenuContext';
import type { ChartOptionsProxy, ChartOptionsService } from '../services/chartOptionsService';
import type { ChartTranslationService } from '../services/chartTranslationService';

interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class TitleEdit extends Component {
    private chartTranslationService: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslationService = beans.chartTranslationService;
    }

    private static TEMPLATE /* html */ = `<textarea
             class="ag-chart-title-edit"
             style="padding:0; border:none; border-radius: 0; min-height: 0; text-align: center; resize: none;" />
        `;

    private destroyableChartListeners: (() => void)[] = [];
    private chartController: ChartController;
    private chartOptionsService: ChartOptionsService;
    private chartMenuUtils: ChartOptionsProxy;
    private editing: boolean = false;

    constructor(private readonly chartMenu: ChartMenu) {
        super(TitleEdit.TEMPLATE);
    }

    public postConstruct(): void {
        this.addManagedListeners(this.getGui(), {
            keydown: (e: KeyboardEvent) => {
                if (this.editing && e.key === 'Enter' && !e.shiftKey) {
                    this.handleEndEditing();
                    e.preventDefault();
                }
            },
            input: () => {
                if (this.editing) {
                    this.updateHeight();
                }
            },
            blur: () => this.endEditing(),
        });
    }

    /* should be called when the containing component changes to a new chart proxy */
    public refreshTitle(chartMenuContext: ChartMenuContext) {
        this.chartController = chartMenuContext.chartController;
        this.chartOptionsService = chartMenuContext.chartOptionsService;
        this.chartMenuUtils = chartMenuContext.chartMenuParamsFactory.getChartOptions();

        for (const destroyFn of this.destroyableChartListeners) {
            destroyFn();
        }
        this.destroyableChartListeners = [];

        const chartProxy = this.chartController.getChartProxy();
        const chart = chartProxy.getChart();
        const canvas = chart.canvasElement;

        let wasInTitle = false;
        this.destroyableChartListeners = this.addManagedElementListeners(canvas, {
            dblclick: (event: MouseEvent) => {
                const { title } = chart;

                if (title && title.node.containsPoint(event.offsetX, event.offsetY)) {
                    const bbox = title.node.computeBBox()!;
                    const xy = title.node.inverseTransformPoint(bbox.x, bbox.y);

                    this.startEditing({ ...bbox, ...xy }, canvas.width);
                }
            },
            mousemove: (event: MouseEvent) => {
                const { title } = chart;

                const inTitle = !!(title && title.enabled && title.node.containsPoint(event.offsetX, event.offsetY));
                if (wasInTitle !== inTitle) {
                    canvas.style.cursor = inTitle ? 'pointer' : '';
                }

                wasInTitle = inTitle;
            },
        });
    }

    private startEditing(titleBBox: BBox, canvasWidth: number): void {
        if (this.editing) {
            return;
        }
        this.editing = true;

        const minimumTargetInputWidth: number = 300;
        const inputWidth = Math.max(Math.min(titleBBox.width + 20, canvasWidth), minimumTargetInputWidth);

        const element = this.getGui() as HTMLTextAreaElement;

        element.classList.add('currently-editing');
        const inputStyle = element.style;

        // match style of input to title that we're editing
        inputStyle.fontFamily = this.chartMenuUtils.getValue('title.fontFamily');
        inputStyle.fontWeight = this.chartMenuUtils.getValue('title.fontWeight');
        inputStyle.fontStyle = this.chartMenuUtils.getValue('title.fontStyle');
        inputStyle.fontSize = this.chartMenuUtils.getValue('title.fontSize') + 'px';
        inputStyle.color = this.chartMenuUtils.getValue('title.color');

        // populate the input with the title, unless the title is the placeholder:
        const oldTitle = this.chartMenuUtils.getValue('title.text');
        const isTitlePlaceholder = oldTitle === this.chartTranslationService.translate('titlePlaceholder');
        element.value = isTitlePlaceholder ? '' : oldTitle;

        const oldTitleLines = oldTitle.split(/\r?\n/g).length;

        inputStyle.left = Math.round(titleBBox.x + titleBBox.width / 2 - inputWidth / 2 - 1) + 'px';
        inputStyle.top =
            Math.round(titleBBox.y + titleBBox.height / 2 - (oldTitleLines * this.getLineHeight()) / 2 - 2) + 'px';
        inputStyle.width = Math.round(inputWidth) + 'px';
        inputStyle.lineHeight = this.getLineHeight() + 'px';
        this.updateHeight();

        element.focus();
    }

    private updateHeight() {
        const element = this.getGui() as HTMLTextAreaElement;

        // The element should cover the title and provide enough space for the new one.
        const oldTitleLines = this.chartMenuUtils.getValue('title.text').split(/\r?\n/g).length;
        const currentTitleLines = element.value.split(/\r?\n/g).length;

        element.style.height = Math.round(Math.max(oldTitleLines, currentTitleLines) * this.getLineHeight()) + 4 + 'px';
    }

    private getLineHeight(): number {
        const fixedLineHeight = this.chartMenuUtils.getValue('title.lineHeight');
        if (fixedLineHeight) {
            return parseInt(fixedLineHeight);
        }
        return Math.round(parseInt(this.chartMenuUtils.getValue('title.fontSize')) * 1.2);
    }

    private handleEndEditing() {
        // special handling to avoid flicker caused by delay when swapping old and new titles

        // 1 - store current title color
        const titleColor = this.chartMenuUtils.getValue('title.color');

        // 2 - hide title by making it transparent
        const transparentColor = 'rgba(0, 0, 0, 0)';
        this.chartMenuUtils.setValue('title.color', transparentColor);

        // 3 - trigger 'end editing' - this will update the chart with the new title
        this.chartOptionsService.awaitChartOptionUpdate(() => this.endEditing());

        // 4 - restore title color to its original value
        this.chartOptionsService.awaitChartOptionUpdate(() => {
            this.chartMenuUtils.setValue('title.color', titleColor);
        });
    }

    private endEditing() {
        if (!this.editing) {
            return;
        }
        this.editing = false;

        const value = (this.getGui() as HTMLTextAreaElement).value;
        if (value && value.trim() !== '') {
            this.chartMenuUtils.setValue('title.text', value);
            this.chartMenuUtils.setValue('title.enabled', true);
        } else {
            this.chartMenuUtils.setValue('title.text', '');
            this.chartMenuUtils.setValue('title.enabled', false);
        }
        this.getGui().classList.remove('currently-editing');

        // await chart updates so `chartTitleEdit` event consumers can read the new state correctly
        this.chartOptionsService.awaitChartOptionUpdate(() => {
            this.eventService.dispatchEvent({ type: 'chartTitleEdit' });
        });
    }
}
