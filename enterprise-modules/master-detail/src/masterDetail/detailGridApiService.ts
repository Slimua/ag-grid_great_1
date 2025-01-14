import type { DetailGridInfo, IDetailGridApiService, NamedBean } from '@ag-grid-community/core';
import { BeanStub, _exists, _iterateObject } from '@ag-grid-community/core';

export class DetailGridApiService extends BeanStub implements NamedBean, IDetailGridApiService {
    beanName = 'detailGridApiService' as const;

    private detailGridInfoMap: { [id: string]: DetailGridInfo | undefined } = {};

    public addDetailGridInfo(id: string, gridInfo: DetailGridInfo): void {
        this.detailGridInfoMap[id] = gridInfo;
    }

    public removeDetailGridInfo(id: string): void {
        delete this.detailGridInfoMap[id];
    }

    public getDetailGridInfo(id: string): DetailGridInfo | undefined {
        return this.detailGridInfoMap[id];
    }

    public forEachDetailGridInfo(callback: (gridInfo: DetailGridInfo, index: number) => void) {
        let index = 0;
        _iterateObject(this.detailGridInfoMap, (id: string, gridInfo: DetailGridInfo) => {
            // check for undefined, as old references will still be lying around
            if (_exists(gridInfo)) {
                callback(gridInfo, index);
                index++;
            }
        });
    }

    public override destroy(): void {
        this.detailGridInfoMap = {};
        super.destroy();
    }
}
