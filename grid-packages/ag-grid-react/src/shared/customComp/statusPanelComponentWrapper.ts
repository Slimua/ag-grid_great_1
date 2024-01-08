import { IStatusPanel, IStatusPanelParams } from "ag-grid-community";
import { CustomComponentWrapper } from "./customComponentWrapper";
import { CustomStatusPanelProps } from "./interfaces";

export class StatusPanelComponentWrapper extends CustomComponentWrapper<IStatusPanelParams, CustomStatusPanelProps, {}> implements IStatusPanel {
    public refresh(params: IStatusPanelParams): boolean {
        this.sourceParams = params;
        this.refreshProps();
        return true;
    }
}
