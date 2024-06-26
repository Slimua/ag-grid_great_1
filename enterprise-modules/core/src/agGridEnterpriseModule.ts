import { ModuleNames, _defineModule } from '@ag-grid-community/core';

import { GridLicenseManager as LicenseManager } from './license/gridLicenseManager';
import { VERSION } from './version';
import { AgMenuItemRenderer } from './widgets/agMenuItemRenderer';

export { AgWatermark } from './license/watermark';

export const EnterpriseCoreModule = _defineModule({
    version: VERSION,
    moduleName: ModuleNames.EnterpriseCoreModule,
    beans: [LicenseManager],
    userComponents: [
        {
            name: 'agMenuItem',
            classImp: AgMenuItemRenderer,
        },
    ],
});
