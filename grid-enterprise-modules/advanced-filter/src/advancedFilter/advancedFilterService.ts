import {
    AdvancedFilterEnabledChangedEvent,
    AdvancedFilterModel,
    AutocompleteEntry,
    AutocompleteListParams,
    Autowired,
    Bean,
    BeanStub,
    ColumnModel,
    DataTypeService,
    Events,
    IAdvancedFilterCtrl,
    IAdvancedFilterService,
    IRowModel,
    IRowNode,
    NewColumnsLoadedEvent,
    PostConstruct,
    PropertyChangedEvent,
    ValueFormatterService,
    ValueParserService,
    ValueService,
    WithoutGridCommon,
    _
} from "@ag-grid-community/core";
import { FilterExpressionParser } from "./filterExpressionParser";
import { ColFilterExpressionParser } from "./colFilterExpressionParser";
import {
    BooleanFilterExpressionOperators,
    FilterExpressionEvaluatorParams,
    FilterExpressionOperators,
    ScalarFilterExpressionOperators,
    TextFilterExpressionOperators,
} from "./filterExpressionOperators";
import { AdvancedFilterCtrl } from "./advancedFilterCtrl";

interface ExpressionProxy {
    getValue(colId: string, node: IRowNode): any;

    getParams(colId: string): FilterExpressionEvaluatorParams<any>;

    operators: FilterExpressionOperators;
}

@Bean('advancedFilterService')
export class AdvancedFilterService extends BeanStub implements IAdvancedFilterService {
    @Autowired('valueService') private valueService: ValueService;
    @Autowired('columnModel') private columnModel: ColumnModel;
    @Autowired('dataTypeService') private dataTypeService: DataTypeService;
    @Autowired('valueFormatterService') private valueFormatterService: ValueFormatterService;
    @Autowired('valueParserService') private valueParserService: ValueParserService;
    @Autowired('rowModel') private rowModel: IRowModel;

    private enabled: boolean;
    private ctrl: AdvancedFilterCtrl;
    private includeHiddenColumns = false;

    private expressionProxy: ExpressionProxy;
    private expression: string | null = null;
    private expressionFunction: Function | null;
    private expressionArgs: any[] | null;
    private columnAutocompleteEntries: AutocompleteEntry[] | null = null;
    private columnNameToIdMap: { [columnNameUpperCase: string]: { colId: string, columnName: string } } = {};
    private expressionOperators: FilterExpressionOperators;
    private expressionJoinOperators: { and: string, or: string };
    private expressionEvaluatorParams: { [colId: string]: FilterExpressionEvaluatorParams<any> } = {};

    @PostConstruct
    private postConstruct(): void {
        this.setEnabled(this.gridOptionsService.is('enableAdvancedFilter'), true);

        this.ctrl = this.createManagedBean(new AdvancedFilterCtrl(this.enabled));

        this.expressionOperators = this.getExpressionOperators();
        this.expressionJoinOperators = this.getExpressionJoinOperators();
        this.expressionProxy = {
            getValue: (colId, node) => {
                const column = this.columnModel.getGridColumn(colId);
                return column ? this.valueService.getValue(column, node, true) : undefined;
            },
            getParams: (colId) => this.getExpressionEvaluatorParams(colId),
            operators: this.expressionOperators
        }
        this.includeHiddenColumns = this.gridOptionsService.is('includeHiddenColumnsInAdvancedFilter');

        this.addManagedPropertyListener('enableAdvancedFilter', (event: PropertyChangedEvent) => this.setEnabled(!!event.currentValue))
        this.addManagedListener(this.eventService, Events.EVENT_GRID_COLUMNS_CHANGED, () => this.resetColumnCaches());
        this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED,
            (event: NewColumnsLoadedEvent) => this.onNewColumnsLoaded(event));
        this.addManagedPropertyListener('includeHiddenColumnsInAdvancedFilter', (event: PropertyChangedEvent) => {
            this.includeHiddenColumns = !!event.currentValue;
            this.resetColumnCaches();
        });
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public isFilterPresent(): boolean {
        return !!this.expressionFunction;
    }

    public doesFilterPass(node: IRowNode): boolean {
        return this.expressionFunction!(this.expressionProxy, node, this.expressionArgs);
    }

    public getModel(): AdvancedFilterModel | null {
        const expressionParser = this.createExpressionParser(this.expression);
        expressionParser?.parseExpression();
        return expressionParser?.getModel() ?? null;
    }

    public setModel(model: AdvancedFilterModel | null): void {
        const parseModel = (model: AdvancedFilterModel, isFirstParent?: boolean): string | null => {
            if (model.filterType === 'join') {
                const operator = model.type === 'OR' ? this.expressionJoinOperators.or : this.expressionJoinOperators.and;
                const expression = model.conditions.map(condition => parseModel(condition)).join(` ${operator} `);
                return isFirstParent ? expression : `(${expression})`;
            } else {
                const { colId } = model;
                const columnEntries = this.getColumnAutocompleteEntries();
                const columnEntry = columnEntries.find(({ key }) => key === colId);
                let columnName;
                if (columnEntry) {
                    columnName = columnEntry.displayValue!;
                    this.columnNameToIdMap[columnName.toLocaleUpperCase()] = { colId, columnName };
                } else {
                    columnName = colId;
                }
                const operator = this.expressionOperators[model.filterType]?.operators?.[model.type]?.displayValue ?? model.type;
                const { filter } = model as any;
                const column = this.columnModel.getGridColumn(colId);
                let operands = '';
                if (column && filter != null) {
                    let operand1 = this.valueFormatterService.formatValue(column, null, filter) ?? _.toStringOrNull(filter);
                    if (operand1 && this.dataTypeService.getBaseDataType(column) !== 'number') {
                        operand1 = `"${operand1}"`;
                    }
                    operands = operand1 == null ? '' : ` ${operand1}`
                }
                return `[${columnName}] ${operator}${operands}`;
            }
        };

        const expression = model ? parseModel(model, true) : null;

        this.setExpressionDisplayValue(expression);
        this.ctrl.refreshComp();
    }

    public getExpressionDisplayValue(): string | null {
        return this.expression;
    }

    public setExpressionDisplayValue(expression: string | null): void {
        this.expression = expression;
        this.parseAndSetExpression(this.expression);
    }

    public createExpressionParser(expression: string | null): FilterExpressionParser | null {
        if (!expression) { return null; }

        const translate= this.localeService.getLocaleTextFunc();
        return new FilterExpressionParser({
            expression,
            columnModel: this.columnModel,
            dataTypeService: this.dataTypeService,
            valueParserService: this.valueParserService,
            columnAutocompleteTypeGenerator: searchString => this.getDefaultAutocompleteListParams(searchString),
            colIdResolver: columnName => this.getColId(columnName),
            columnValueCreator: updateEntry => this.getColumnValue(updateEntry),
            operators: this.expressionOperators,
            joinOperators: this.expressionJoinOperators,
            translate
        });
    }

    public getDefaultAutocompleteListParams(searchString: string): AutocompleteListParams {
        return {
            enabled: true,
            type: 'column',
            searchString,
            entries: this.getColumnAutocompleteEntries()
        };
    }

    public getColumnValue({ displayValue }: AutocompleteEntry): string {
        return `${ColFilterExpressionParser.COL_START_CHAR}${displayValue}${ColFilterExpressionParser.COL_END_CHAR}`;
    }

    public getDefaultExpression(updateEntry: AutocompleteEntry): {
        updatedValue: string, updatedPosition: number
    } {
        const updatedValue = this.getColumnValue(updateEntry) + ' ';
        return {
            updatedValue,
            updatedPosition: updatedValue.length
        };
    }

    public updateAutocompleteCache(updateEntry: AutocompleteEntry, type?: string): void {
        if (type === 'column') {
            const { key: colId, displayValue } = updateEntry;
            this.columnNameToIdMap[updateEntry.displayValue!.toLocaleUpperCase()] = { colId, columnName: displayValue! };
        }
    }

    public isHeaderActive(): boolean {
        return !this.gridOptionsService.get('advancedFilterParent');
    }

    public getCtrl(): IAdvancedFilterCtrl {
        return this.ctrl;
    }

    private setEnabled(enabled: boolean, silent?: boolean): void {
        const previousValue = this.enabled;
        const isClientSideRowModel = this.rowModel.getType() === 'clientSide';
        if (enabled && !isClientSideRowModel) {
            _.doOnce(() => {
                console.warn('AG Grid: Advanced Filter is only supported with the Client-Side Row Model.');
            }, 'advancedFilterCSRM')
        }
        this.enabled = enabled && isClientSideRowModel;
        if (!silent && this.enabled !== previousValue) {
            const event: WithoutGridCommon<AdvancedFilterEnabledChangedEvent> = {
                type: Events.EVENT_ADVANCED_FILTER_ENABLED_CHANGED,
                enabled: this.enabled
            };
            this.eventService.dispatchEvent(event);
        }
    }

    private parseAndSetExpression(expression: string | null): void {
        this.expressionFunction = null;
        this.expressionArgs = null;

        const expressionParser = this.createExpressionParser(expression);

        if (!expressionParser) { return; }

        expressionParser.parseExpression();
        const isValid = expressionParser.isValid();

        if (!isValid) { return; }

        const { functionBody, args } = expressionParser.getFunction();

        this.expressionFunction = new Function('expressionProxy', 'node', 'args', functionBody);
        this.expressionArgs = args;
    }

    private getColumnAutocompleteEntries(): AutocompleteEntry[] {
        if (this.columnAutocompleteEntries) {
            return this.columnAutocompleteEntries;
        }
        const columns = this.columnModel.getAllPrimaryColumns() ?? [];
        const entries: AutocompleteEntry[] = [];
        columns.forEach(column => {
            if (column.getColDef().filter && (this.includeHiddenColumns || column.isVisible() || column.isRowGroupActive())) {
                entries.push({
                    key: column.getColId(),
                    displayValue: this.columnModel.getDisplayNameForColumn(column, 'advancedFilter')!
                });
            }
        });
        entries.sort((a, b) => {
            const aValue = a.displayValue ?? '';
            const bValue = b.displayValue ?? '';
            if (aValue < bValue) {
                return -1
            } else if (bValue > aValue) {
                return 1;
            }
            return 0;
        })
        return entries;
    }

    private getColId(columnName: string): { colId: string, columnName: string } | null {
        const upperCaseColumnName = columnName.toLocaleUpperCase();
        const cachedColId = this.columnNameToIdMap[upperCaseColumnName];
        if (cachedColId) { return cachedColId; }

        const columnAutocompleteEntries = this.getColumnAutocompleteEntries();
        const colEntry = columnAutocompleteEntries.find(({ displayValue }) => displayValue!.toLocaleUpperCase() === upperCaseColumnName);
        if (colEntry) {
            const { key: colId, displayValue } = colEntry;
            const colValue = { colId, columnName: displayValue! };
            // cache for faster lookup
            this.columnNameToIdMap[upperCaseColumnName] = colValue;
            return colValue;
        }
        return null;
    }

    private getExpressionOperators(): FilterExpressionOperators {
        const translate = this.localeService.getLocaleTextFunc();
        return {
            text: new TextFilterExpressionOperators({ translate }),
            boolean: new BooleanFilterExpressionOperators({ translate }),
            object: new TextFilterExpressionOperators<any>({ translate }),
            number: new ScalarFilterExpressionOperators<number>({ translate, equals: (v, o) => v === o }),
            date: new ScalarFilterExpressionOperators<Date>({ translate, equals: (v: Date, o: Date) => v.getTime() === o.getTime() }),
            dateString: new ScalarFilterExpressionOperators<Date, string>({ translate, equals: (v: Date, o: Date) => v.getTime() === o.getTime() })
        }
    }

    private getExpressionJoinOperators(): { and: string, or: string } {
        const translate = this.localeService.getLocaleTextFunc();
        return { and: translate('advancedFilterAnd', 'AND'), or: translate('advancedFilterOr', 'OR') }
    }

    private getExpressionEvaluatorParams<ConvertedTValue, TValue = ConvertedTValue>(colId: string): FilterExpressionEvaluatorParams<ConvertedTValue, TValue> {
        let params = this.expressionEvaluatorParams[colId];
        if (!params) {
            const column = this.columnModel.getGridColumn(colId);
            if (column) {
                const baseCellDataType = this.dataTypeService.getBaseDataType(column);
                switch (baseCellDataType) {
                    case 'dateString':
                        params = {
                            valueConverter: this.dataTypeService.getDateParserFunction()
                        };
                        break;
                    case 'object':
                        params = {
                            valueConverter: (value, node) => this.valueFormatterService.formatValue(column, node, value)
                                ?? (typeof value.toString === 'function' ? value.toString() : '')
                        };
                        break;
                    default:
                        params = { valueConverter: (v: any) => v };
                        break;
                }
                const { filterParams } = column.getColDef();
                if (filterParams) {
                    [
                        'caseSensitive', 'includeBlanksInEquals', 'includeBlanksInLessThan', 'includeBlanksInGreaterThan'
                    ].forEach((param: keyof FilterExpressionEvaluatorParams<ConvertedTValue, TValue>) => {
                        const paramValue = filterParams[param];
                        if (paramValue) {
                            params[param] = paramValue
                        }
                    });
                }
                this.expressionEvaluatorParams[colId] = params;
            } else {
                params = { valueConverter: (v: any) => v };
            }
        }
        return params;
    }

    private resetColumnCaches(): void {
        this.columnAutocompleteEntries = null;
        this.columnNameToIdMap = {};
    }

    private onNewColumnsLoaded(event: NewColumnsLoadedEvent): void {
        if (event.source !== 'gridInitializing') { return; }

        const setModel = () => this.setModel(this.gridOptionsService.get('advancedFilterModel') ?? null);

        if (this.dataTypeService.isPendingInference()) {
            this.ctrl.setInputDisabled(true);
            const destroyFunc = this.addManagedListener(this.eventService, Events.EVENT_DATA_TYPES_INFERRED, () => {
                destroyFunc?.();
                setModel();
                this.ctrl.setInputDisabled(false);
            });
        } else {
            setModel();
        }
    }
}
