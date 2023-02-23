import { AgPromise, ICellRendererComp } from "@ag-grid-community/core";

/**
 * cell renderers are used in a few places. they bind to dom slightly differently to other cell renderes as they
 * can return back strings (instead of html elemnt) in the getGui() method. common code placed here to handle that.
 * @param {AgPromise<ICellRendererComp>} cellRendererPromise
 * @param {HTMLElement} eTarget
 */
export function bindCellRendererToHtmlElement(cellRendererPromise: AgPromise<ICellRendererComp>, eTarget: HTMLElement) {
    cellRendererPromise.then(cellRenderer => {
        const gui: HTMLElement | string = cellRenderer!.getGui();

        if (gui != null) {
            if (typeof gui === 'object') {
                eTarget.appendChild(gui);
            } else {
                eTarget.innerHTML = gui;
            }
        }
    });
}