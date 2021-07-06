import { Autowired, Bean } from "../../context/context";
import { IComponent } from "../../interfaces/iComponent";
import { ComponentMetadata, ComponentMetadataProvider } from "./componentMetadataProvider";
import { ComponentSource } from "./userComponentFactory";
import { ICellRendererComp, ICellRendererParams } from "../../rendering/cellRenderers/iCellRenderer";
import { BeanStub } from "../../context/beanStub";
import { loadTemplate } from "../../utils/dom";

@Bean("agComponentUtils")
export class AgComponentUtils extends BeanStub {

    @Autowired("componentMetadataProvider")
    private componentMetadataProvider: ComponentMetadataProvider;

    public adaptFunction<A extends IComponent<any> & B, B, TParams>(
        propertyName: string,
        hardcodedJsFunction: any,
        componentFromFramework: boolean,
        source: ComponentSource
    ): any {
        if (hardcodedJsFunction == null) {
            return {
                component: null,
                componentFromFramework: componentFromFramework,
                source: source,
                paramsFromSelector: null
            };
        }

        const metadata: ComponentMetadata = this.componentMetadataProvider.retrieve(propertyName);
        if (metadata && metadata.functionAdapter) {
            return {
                componentFromFramework: componentFromFramework,
                component: metadata.functionAdapter(hardcodedJsFunction) as { new(): A; },
                source: source,
                paramsFromSelector: null
            };
        }
        return null;
    }

    public adaptCellRendererFunction(callback: any): { new(): IComponent<ICellRendererParams>; } {
        class Adapter implements ICellRendererComp {
            private params: ICellRendererParams;

            refresh(params: ICellRendererParams): boolean {
                return false;
            }

            getGui(): HTMLElement {
                const callbackResult: string | HTMLElement = callback(this.params);
                const type = typeof callbackResult;
                if (type === 'string' || type === 'number' || type === 'boolean') {
                    return loadTemplate('<span>' + callbackResult + '</span>');
                }
                return callbackResult as HTMLElement;
            }

            init?(params: ICellRendererParams): void {
                this.params = params;
            }
        }

        return Adapter;
    }

    public doesImplementIComponent(candidate: any): boolean {
        if (!candidate) { return false; }
        return (candidate as any).prototype && 'getGui' in (candidate as any).prototype;
    }
}
