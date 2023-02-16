import { IFloatingFilterParams } from '../floatingFilter';
import { ProvidedFilterModel } from '../../../interfaces/iFilter';
import { SimpleFloatingFilter } from './simpleFloatingFilter';
import { FilterChangedEvent } from '../../../events';
import { TextFilter, TextFilterModel } from '../../provided/text/textFilter';
import { NumberFilter, NumberFilterModel } from '../../provided/number/numberFilter';
declare type ModelUnion = TextFilterModel | NumberFilterModel;
export declare abstract class TextInputFloatingFilter<M extends ModelUnion> extends SimpleFloatingFilter {
    private readonly columnModel;
    private readonly eFloatingFilterInput;
    protected params: IFloatingFilterParams<TextFilter | NumberFilter>;
    private applyActive;
    private postConstruct;
    private resetTemplate;
    protected getDefaultDebounceMs(): number;
    onParentModelChanged(model: ProvidedFilterModel, event: FilterChangedEvent): void;
    init(params: IFloatingFilterParams<TextFilter | NumberFilter>): void;
    private syncUpWithParentFilter;
    protected setEditable(editable: boolean): void;
}
export {};
