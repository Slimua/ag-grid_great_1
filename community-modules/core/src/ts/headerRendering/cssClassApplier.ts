import { AbstractColDef } from "../entities/colDef";
import { GridOptionsWrapper } from "../gridOptionsWrapper";
import { ColumnGroup } from "../entities/columnGroup";
import { Column } from "../entities/column";
import { OriginalColumnGroup } from "../entities/originalColumnGroup";
import { missing } from "../utils/generic";
import { addCssClass } from "../utils/dom";

export class CssClassApplier {

    public static addHeaderClassesFromColDef(abstractColDef: AbstractColDef | null, eHeaderCell: HTMLElement, gridOptionsWrapper: GridOptionsWrapper, column: Column | null, columnGroup: ColumnGroup | null) {
        if (missing(abstractColDef)) { return; }
        this.addColumnClassesFromCollDef(abstractColDef.headerClass, abstractColDef, eHeaderCell, gridOptionsWrapper, column, columnGroup);
    }

    public static addToolPanelClassesFromColDef(abstractColDef: AbstractColDef | null, eHeaderCell: HTMLElement, gridOptionsWrapper: GridOptionsWrapper, column: Column | null, columnGroup: OriginalColumnGroup | null) {
        if (missing(abstractColDef)) { return; }
        this.addColumnClassesFromCollDef(abstractColDef.toolPanelClass, abstractColDef, eHeaderCell, gridOptionsWrapper, column, columnGroup);
    }

    public static addColumnClassesFromCollDef(classesOrFunc: string | string[] | ((params: any) => string | string[]) | null | undefined,
                                              abstractColDef: AbstractColDef,
                                              eHeaderCell: HTMLElement,
                                              gridOptionsWrapper: GridOptionsWrapper,
                                              column: Column | null,
                                              columnGroup: ColumnGroup | OriginalColumnGroup | null) {
        if (missing(classesOrFunc)) {
            return;
        }
        let classToUse: string | string[];
        if (typeof classesOrFunc === 'function') {
            const params = {
                // bad naming, as colDef here can be a group or a column,
                // however most people won't appreciate the difference,
                // so keeping it as colDef to avoid confusion.
                colDef: abstractColDef,
                column: column,
                columnGroup: columnGroup,
                context: gridOptionsWrapper.getContext(),
                api: gridOptionsWrapper.getApi()
            };
            const headerClassFunc = classesOrFunc as (params: any) => string | string[];
            classToUse = headerClassFunc(params);
        } else {
            classToUse = classesOrFunc;
        }

        if (typeof classToUse === 'string') {
            addCssClass(eHeaderCell, classToUse);
        } else if (Array.isArray(classToUse)) {
            classToUse.forEach((cssClassItem: any): void => {
                addCssClass(eHeaderCell, cssClassItem);
            });
        }
    }
}