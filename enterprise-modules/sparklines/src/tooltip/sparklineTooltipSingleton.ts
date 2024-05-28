import type { BeanName } from '@ag-grid-community/core';
import { BeanStub } from '@ag-grid-community/core';

import { SparklineTooltip } from '../sparkline/tooltip/sparklineTooltip';

/**
 * This 'bean' creates a single sparkline tooltip that is bound to the grid lifecycle.
 */
export class SparklineTooltipSingleton extends BeanStub {
    beanName: BeanName = 'sparklineTooltipSingleton';

    private tooltip!: SparklineTooltip;

    public postConstruct(): void {
        this.tooltip = new SparklineTooltip();
    }

    public getSparklineTooltip() {
        return this.tooltip;
    }

    public override destroy(): void {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
        super.destroy();
    }
}
