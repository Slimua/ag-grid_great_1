import { BeanStub } from "../context/beanStub";
import { Bean, PostConstruct } from "../context/context";

import { Events } from "../eventKeys";

@Bean('pinnedWidthService')
export class PinnedWidthService extends BeanStub {

    private leftWidth: number;
    private rightWidth: number;

    @PostConstruct
    private postConstruct(): void {
        const listener = this.checkContainerWidths.bind(this);
        this.addManagedEventListener(Events.EVENT_DISPLAYED_COLUMNS_CHANGED, listener);
        this.addManagedEventListener(Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED, listener);
        this.addManagedPropertyListener('domLayout', listener);
    }

    private checkContainerWidths() {

        const printLayout = this.beans.gos.isDomLayout('print');

        const newLeftWidth = printLayout ? 0 : this.beans.columnModel.getDisplayedColumnsLeftWidth();
        const newRightWidth = printLayout ? 0 : this.beans.columnModel.getDisplayedColumnsRightWidth();

        if (newLeftWidth != this.leftWidth) {
            this.leftWidth = newLeftWidth;
            this.beans.eventService.dispatchEvent({type: Events.EVENT_LEFT_PINNED_WIDTH_CHANGED});
        }

        if (newRightWidth != this.rightWidth) {
            this.rightWidth = newRightWidth;
            this.beans.eventService.dispatchEvent({type: Events.EVENT_RIGHT_PINNED_WIDTH_CHANGED});
        }
    }

    public getPinnedRightWidth(): number {
        return this.rightWidth;
    }

    public getPinnedLeftWidth(): number {
        return this.leftWidth;
    }
}