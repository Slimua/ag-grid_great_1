import { Autowired, Bean, PostConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { GridBodyCtrl } from "../gridBodyComp/gridBodyCtrl";
import { CtrlsService } from "../ctrlsService";

@Bean('columnAnimationService')
export class ColumnAnimationService extends BeanStub {

    @Autowired('ctrlsService') private ctrlsService: CtrlsService;

    private gridBodyCtrl: GridBodyCtrl;

    private executeNextFuncs: Function[] = [];
    private executeLaterFuncs: Function[] = [];

    private active = false;

    private animationThreadCount = 0;

    @PostConstruct
    private postConstruct(): void {
        this.ctrlsService.whenReady(p => this.gridBodyCtrl = p.gridBodyCtrl);
    }

    public isActive(): boolean {
        return this.active;
    }

    public start(): void {
        if (this.active) { return; }

        if (this.gridOptionsService.get('suppressColumnMoveAnimation')) { return; }

        // if doing RTL, we don't animate open / close as due to how the pixels are inverted,
        // the animation moves all the row the the right rather than to the left (ie it's the static
        // columns that actually get their coordinates updated)
        if (this.gridOptionsService.get('enableRtl')) { return; }

        this.ensureAnimationCssClassPresent();

        this.active = true;
    }

    public finish(): void {
        if (!this.active) { return; }
        this.executeNextVMTurn(() => {
            // React components can be setup asynchronously meaning comps can call executeNextVMTurn after finish has been called
            // This flushes any remaining executeNextVMTurn calls asap
            this.flush();
        });
        this.executeLaterVMTurn(() => {
            this.active = false;
            // Ensure anything remaining is also executed now that active is false preventing any further executeNextVMTurn / executeLaterVMTurn calls
            this.flush();
        });
        this.flush();
    }

    public executeNextVMTurn(func: Function): void {
        if (this.active) {
            this.executeNextFuncs.push(func);
        } else {
            func();
        }
    }

    public executeLaterVMTurn(func: Function): void {
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

    public flush(): void {
        const nowFuncs = this.executeNextFuncs;
        this.executeNextFuncs = [];

        const waitFuncs = this.executeLaterFuncs;
        this.executeLaterFuncs = [];

        if (nowFuncs.length === 0 && waitFuncs.length === 0) { return; }

        this.getFrameworkOverrides().wrapIncoming(() => {
            window.setTimeout(() => nowFuncs.forEach(func => func()), 0);
            window.setTimeout(() => waitFuncs.forEach(func => func()), 200);
        });
    }
}
