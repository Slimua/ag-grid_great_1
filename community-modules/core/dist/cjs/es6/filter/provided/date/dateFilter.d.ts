// Type definitions for @ag-grid-community/core v29.1.0
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { DateCompWrapper } from './dateCompWrapper';
import { ConditionPosition, ISimpleFilterModel, SimpleFilterModelFormatter, Tuple } from '../simpleFilter';
import { Comparator, IScalarFilterParams, ScalarFilter } from '../scalarFilter';
import { IAfterGuiAttachedParams } from '../../../interfaces/iAfterGuiAttachedParams';
import { IFilterOptionDef, IFilterParams } from '../../../interfaces/iFilter';
import { LocaleService } from '../../../localeService';
import { OptionsFactory } from '../optionsFactory';
export interface DateFilterModel extends ISimpleFilterModel {
    /** Filter type is always `'date'` */
    filterType?: 'date';
    /**
     * The date value(s) associated with the filter. The type is `string` and format is always
     * `YYYY-MM-DD hh:mm:ss` e.g. 2019-05-24 00:00:00. Custom filters can have no values (hence both
     * are optional). Range filter has two values (from and to).
     */
    dateFrom: string | null;
    /**
     * Range filter `to` date value.
     */
    dateTo: string | null;
}
/**
 * Parameters provided by the grid to the `init` method of a `DateFilter`.
 * Do not use in `colDef.filterParams` - see `IDateFilterParams` instead.
 */
export declare type DateFilterParams<TData = any> = IDateFilterParams & IFilterParams<TData>;
/**
 * Parameters used in `colDef.filterParams` to configure a Date Filter (`agDateColumnFilter`).
 */
export interface IDateFilterParams extends IScalarFilterParams {
    /** Required if the data for the column are not native JS `Date` objects. */
    comparator?: IDateComparatorFunc;
    /**
     * Defines whether the grid uses the browser date picker or a plain text box.
     *  - `true`: Force the browser date picker to be used.
     *  - `false`: Force a plain text box to be used.
     *
     * Default: `undefined` - If a date component is not provided, then the grid will use the browser date picker
     * for all supported browsers and a plain text box for other browsers.
     */
    browserDatePicker?: boolean;
    /** This is the minimum year that may be entered in a date field for the value to be considered valid. Default: `1000` */
    minValidYear?: number;
    /** This is the maximum year that may be entered in a date field for the value to be considered valid. Default is no restriction. */
    maxValidYear?: number;
    /**
     * Defines the date format for the floating filter text when an in range filter has been applied.
     *
     * Default: `YYYY-MM-DD`
     */
    inRangeFloatingFilterDateFormat?: string;
}
export interface IDateComparatorFunc {
    (filterLocalDateAtMidnight: Date, cellValue: any): number;
}
export declare class DateFilterModelFormatter extends SimpleFilterModelFormatter {
    private readonly dateFilterParams;
    constructor(dateFilterParams: DateFilterParams, localeService: LocaleService, optionsFactory: OptionsFactory);
    protected conditionToString(condition: DateFilterModel, options?: IFilterOptionDef): string;
}
export declare class DateFilter extends ScalarFilter<DateFilterModel, Date, DateCompWrapper> {
    static DEFAULT_FILTER_OPTIONS: import("../simpleFilter").ISimpleFilterModelType[];
    private readonly eCondition1PanelFrom;
    private readonly eCondition1PanelTo;
    private readonly eCondition2PanelFrom;
    private readonly eCondition2PanelTo;
    private dateCondition1FromComp;
    private dateCondition1ToComp;
    private dateCondition2FromComp;
    private dateCondition2ToComp;
    private readonly userComponentFactory;
    private dateFilterParams;
    private minValidYear;
    private maxValidYear;
    private filterModelFormatter;
    constructor();
    afterGuiAttached(params?: IAfterGuiAttachedParams): void;
    protected mapValuesFromModel(filterModel: DateFilterModel | null): Tuple<Date>;
    protected comparator(): Comparator<Date>;
    private defaultComparator;
    protected setParams(params: DateFilterParams): void;
    private createDateComponents;
    protected setElementValue(element: DateCompWrapper, value: Date | null, silent?: boolean): void;
    protected setElementDisplayed(element: DateCompWrapper, displayed: boolean): void;
    protected setElementDisabled(element: DateCompWrapper, disabled: boolean): void;
    protected getDefaultFilterOptions(): string[];
    protected createValueTemplate(position: ConditionPosition): string;
    protected isConditionUiComplete(position: ConditionPosition): boolean;
    protected areSimpleModelsEqual(aSimple: DateFilterModel, bSimple: DateFilterModel): boolean;
    protected getFilterType(): 'date';
    protected createCondition(position: ConditionPosition): DateFilterModel;
    protected resetPlaceholder(): void;
    protected getInputs(): Tuple<DateCompWrapper>[];
    protected getValues(position: ConditionPosition): Tuple<Date>;
    getModelAsString(model: ISimpleFilterModel): string;
}
