import { ModuleNames } from "@ag-grid-community/core";
import { EnterpriseCoreModule } from "@ag-grid-enterprise/core";
import { VERSION } from "./version";
import { ViewportRowModel } from "./viewportRowModel/viewportRowModel";
export const ViewportRowModelModule = {
    version: VERSION,
    moduleName: ModuleNames.ViewportRowModelModule,
    rowModels: { viewport: ViewportRowModel },
    dependantModules: [
        EnterpriseCoreModule
    ]
};
