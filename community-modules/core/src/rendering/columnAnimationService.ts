import { BeanStub } from '../context/beanStub';
import type { BeanCollection, BeanName } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { GridBodyCtrl } from '../gridBodyComp/gridBodyCtrl';

export class ColumnAnimationService extends BeanStub {
    beanName: BeanName = 'columnAnimationService';

    private ctrlsService: CtrlsService;

    public wireBeans(beans: BeanCollection): void {
        super.wireBeans(beans);
        this.ctrlsService = beans.ctrlsService;
    }

    private gridBodyCtrl: GridBodyCtrl;

    private executeNextFuncs: ((...args: any[]) => any)[] = [];
    private executeLaterFuncs: ((...args: any[]) => any)[] = [];

    private active = false;
    private suppressAnimation = false;

    private animationThreadCount = 0;

    public postConstruct(): void {
        this.ctrlsService.whenReady((p) => (this.gridBodyCtrl = p.gridBodyCtrl));
    }

    public isActive(): boolean {
        return this.active && !this.suppressAnimation;
    }

    public setSuppressAnimation(suppress: boolean): void {
        this.suppressAnimation = suppress;
    }

    public start(): void {
        if (this.active) {
            return;
        }

        if (this.gos.get('suppressColumnMoveAnimation')) {
            return;
        }

        // if doing RTL, we don't animate open / close as due to how the pixels are inverted,
        // the animation moves all the row the the right rather than to the left (ie it's the static
        // columns that actually get their coordinates updated)
        if (this.gos.get('enableRtl')) {
            return;
        }

        this.ensureAnimationCssClassPresent();

        this.active = true;
    }

    public finish(): void {
        if (!this.active) {
            return;
        }
        this.flush(() => {
            this.active = false;
        });
    }

    public executeNextVMTurn(func: (...args: any[]) => any): void {
        if (this.active) {
            this.executeNextFuncs.push(func);
        } else {
            func();
        }
    }

    public executeLaterVMTurn(func: (...args: any[]) => any): void {
        if (this.active) {
            this.executeLaterFuncs.push(func);
        } else {
            func();
        }
    }

    private ensureAnimationCssClassPresent(): void {
        // up the count, so we can tell if someone else has updated the count
        // by the time the 'wait' func executes
        this.animationThreadCount++;
        const animationThreadCountCopy = this.animationThreadCount;
        this.gridBodyCtrl.setColumnMovingCss(true);

        this.executeLaterFuncs.push(() => {
            // only remove the class if this thread was the last one to update it
            if (this.animationThreadCount === animationThreadCountCopy) {
                this.gridBodyCtrl.setColumnMovingCss(false);
            }
        });
    }

    private flush(callback: () => void): void {
        if (this.executeNextFuncs.length === 0 && this.executeLaterFuncs.length === 0) {
            callback();
            return;
        }

        const runFuncs = (queue: ((...args: any[]) => any)[]) => {
            while (queue.length) {
                const func = queue.pop();
                if (func) {
                    func();
                }
            }
        };

        this.getFrameworkOverrides().wrapIncoming(() => {
            window.setTimeout(() => runFuncs(this.executeNextFuncs), 0);
            window.setTimeout(() => {
                // run the callback before executeLaterFuncs
                // because some functions being executed later
                // check if this service is `active`.
                callback();
                runFuncs(this.executeLaterFuncs);
            }, 200);
        });
    }
}
