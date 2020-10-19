import { Bean, PostConstruct } from "../context/context";
import { ICellRenderer, ICellRendererFunc } from "./cellRenderers/iCellRenderer";
import { AnimateSlideCellRenderer } from "./cellRenderers/animateSlideCellRenderer";
import { AnimateShowChangeCellRenderer } from "./cellRenderers/animateShowChangeCellRenderer";
import { GroupCellRenderer } from "./cellRenderers/groupCellRenderer";
import { missing } from "../utils/generic";

@Bean('cellRendererFactory')
export class CellRendererFactory {

    public static ANIMATE_SLIDE = 'animateSlide';
    public static ANIMATE_SHOW_CHANGE = 'animateShowChange';
    public static GROUP = 'group';

    private cellRendererMap: {[key: string]: {new(): ICellRenderer} | ICellRendererFunc} = {};

    @PostConstruct
    private init(): void {
        this.cellRendererMap[CellRendererFactory.ANIMATE_SLIDE] = AnimateSlideCellRenderer;
        this.cellRendererMap[CellRendererFactory.ANIMATE_SHOW_CHANGE] = AnimateShowChangeCellRenderer;
        this.cellRendererMap[CellRendererFactory.GROUP] = GroupCellRenderer;

        // this.registerRenderersFromGridOptions();
    }

    // private registerRenderersFromGridOptions(): void {
    //     let userProvidedCellRenderers = this.gridOptionsWrapper.getCellRenderers();
    //     iterateObject(userProvidedCellRenderers, (key: string, cellRenderer: {new(): ICellRenderer} | ICellRendererFunc)=> {
    //         this.addCellRenderer(key, cellRenderer);
    //     });
    // }

    public addCellRenderer(key: string, cellRenderer: {new(): ICellRenderer} | ICellRendererFunc): void {
        this.cellRendererMap[key] = cellRenderer;
    }

    public getCellRenderer(key: string): {new(): ICellRenderer} | ICellRendererFunc | null {

        const result = this.cellRendererMap[key];
        if (missing(result)) {
            console.warn('ag-Grid: unable to find cellRenderer for key ' + key);
            return null;
        }

        return result;
    }
}
