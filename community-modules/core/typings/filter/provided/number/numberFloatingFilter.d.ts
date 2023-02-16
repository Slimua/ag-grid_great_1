import { NumberFilter, NumberFilterModel } from './numberFilter';
import { TextInputFloatingFilter } from '../../floating/provided/textInputFloatingFilter';
import { SimpleFilterModelFormatter } from '../simpleFilter';
import { IFloatingFilterParams } from '../../floating/floatingFilter';
export declare class NumberFloatingFilter extends TextInputFloatingFilter<NumberFilterModel> {
    private filterModelFormatter;
    init(params: IFloatingFilterParams<NumberFilter>): void;
    protected getDefaultFilterOptions(): string[];
    protected getFilterModelFormatter(): SimpleFilterModelFormatter;
}
