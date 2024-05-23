import { Bean, BeanStub } from '@ag-grid-community/core';

import type { ILicenseManager } from './shared/licenseManager';
import { LicenseManager } from './shared/licenseManager';

@Bean('licenseManager')
export class GridLicenseManager extends BeanStub {
    private licenseManager: LicenseManager;

    public postConstruct(): void {
        this.validateLicense();
    }

    public validateLicense(): void {
        this.licenseManager = new LicenseManager(this.gos.getDocument());
        this.licenseManager.validateLicense();
    }

    static getLicenseDetails(licenseKey: string) {
        return new LicenseManager(null as any).getLicenseDetails(licenseKey);
    }

    public isDisplayWatermark(): boolean {
        return this.licenseManager.isDisplayWatermark();
    }

    public getWatermarkMessage(): string {
        return this.licenseManager.getWatermarkMessage();
    }

    static setLicenseKey(licenseKey: string): void {
        LicenseManager.setLicenseKey(licenseKey);
    }

    static setChartsLicenseManager(chartsLicenseManager: ILicenseManager) {
        LicenseManager.setChartsLicenseManager(chartsLicenseManager);
    }
}
