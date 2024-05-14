import { Module, ModuleNames, ModuleRegistry } from "@ag-grid-community/core";
import { EnterpriseCoreModule } from "@ag-grid-enterprise/core";
import { RangeService } from "./rangeSelection/rangeService";
import { FillHandle } from "./rangeSelection/fillHandle";
import { RangeHandle } from "./rangeSelection/rangeHandle";
import { SelectionHandleFactory } from "./rangeSelection/selectionHandleFactory";
import { VERSION } from "./version";

export const RangeSelectionModule: Module = {
    version: VERSION,
    moduleName: ModuleNames.RangeSelectionModule,
    beans: [RangeService, SelectionHandleFactory],
    agStackComponents: [
        { componentName: 'AgFillHandle', componentClass: FillHandle },
        { componentName: 'AgRangeHandle', componentClass: RangeHandle }
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};

export function useRangeSelection(): void {
    ModuleRegistry.__registerModules([RangeSelectionModule],false, undefined);
}