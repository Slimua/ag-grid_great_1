import type { Module } from '@ag-grid-community/core';
import { EditCoreModule, ModuleNames } from '@ag-grid-community/core';
import { EnterpriseCoreModule } from '@ag-grid-enterprise/core';

import { RichSelectCellEditor } from './richSelect/richSelectCellEditor';
import { VERSION } from './version';

export const RichSelectModule: Module = {
    version: VERSION,
    moduleName: ModuleNames.RichSelectModule,
    beans: [],
    userComponents: [
        { componentName: 'agRichSelect', componentClass: RichSelectCellEditor },
        { componentName: 'agRichSelectCellEditor', componentClass: RichSelectCellEditor },
    ],
    dependantModules: [EnterpriseCoreModule, EditCoreModule],
};
