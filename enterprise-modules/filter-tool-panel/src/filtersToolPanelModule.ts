import { Module, ModuleNames, ModuleRegistry } from "@ag-grid-community/core";
import { EnterpriseCoreModule } from "@ag-grid-enterprise/core";
import { FiltersToolPanelHeaderPanel } from "./filterToolPanel/filtersToolPanelHeaderPanel";
import { FiltersToolPanelListPanel } from "./filterToolPanel/filtersToolPanelListPanel";
import { FiltersToolPanel } from "./filterToolPanel/filtersToolPanel";
import { SideBarModule } from "@ag-grid-enterprise/side-bar";
import { VERSION } from "./version";

export const FiltersToolPanelModule: Module = {
    version: VERSION,
    moduleName: ModuleNames.FiltersToolPanelModule,
    beans: [],
    agStackComponents: [
        { componentName: 'AgFiltersToolPanelHeader', componentClass: FiltersToolPanelHeaderPanel },
        { componentName: 'AgFiltersToolPanelList', componentClass: FiltersToolPanelListPanel }
    ],
    userComponents: [
        { componentName: 'agFiltersToolPanel', componentClass: FiltersToolPanel },
    ],
    dependantModules: [
        SideBarModule,
        EnterpriseCoreModule
    ]
};

export function useFiltersToolPanel(): void {
    ModuleRegistry.__registerModules([FiltersToolPanelModule],false, undefined);
}