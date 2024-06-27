import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { AgProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import type { AbstractColDef, ColDef, HeaderLocation, HeaderValueGetterParams, IAggFunc } from '../entities/colDef';
import { _warnOnce } from '../utils/function';
import { _exists } from '../utils/generic';
import { _camelCaseToHumanText } from '../utils/string';
import type { ExpressionService } from '../valueService/expressionService';
import type { ColumnModel } from './columnModel';
import type { FuncColsService } from './funcColsService';

export class ColumnNameService extends BeanStub implements NamedBean {
    beanName = 'columnNameService' as const;

    private expressionService: ExpressionService;
    private funcColsService: FuncColsService;
    private columnModel: ColumnModel;

    public wireBeans(beans: BeanCollection) {
        this.expressionService = beans.expressionService;
        this.funcColsService = beans.funcColsService;
        this.columnModel = beans.columnModel;
    }

    public getDisplayNameForColumn(
        column: AgColumn | null,
        location: HeaderLocation,
        includeAggFunc = false
    ): string | null {
        if (!column) {
            return null;
        }

        const headerName: string | null = this.getHeaderName(column.getColDef(), column, null, null, location);

        if (includeAggFunc) {
            return this.wrapHeaderNameWithAggFunc(column, headerName);
        }

        return headerName;
    }

    public getDisplayNameForProvidedColumnGroup(
        columnGroup: AgColumnGroup | null,
        providedColumnGroup: AgProvidedColumnGroup | null,
        location: HeaderLocation
    ): string | null {
        const colGroupDef = providedColumnGroup ? providedColumnGroup.getColGroupDef() : null;

        if (colGroupDef) {
            return this.getHeaderName(colGroupDef, null, columnGroup, providedColumnGroup, location);
        }

        return null;
    }

    public getDisplayNameForColumnGroup(columnGroup: AgColumnGroup, location: HeaderLocation): string | null {
        return this.getDisplayNameForProvidedColumnGroup(columnGroup, columnGroup.getProvidedColumnGroup(), location);
    }

    // location is where the column is going to appear, ie who is calling us
    private getHeaderName(
        colDef: AbstractColDef,
        column: AgColumn | null,
        columnGroup: AgColumnGroup | null,
        providedColumnGroup: AgProvidedColumnGroup | null,
        location: HeaderLocation
    ): string | null {
        const headerValueGetter = colDef.headerValueGetter;

        if (headerValueGetter) {
            const params: HeaderValueGetterParams = this.gos.addGridCommonParams({
                colDef: colDef,
                column: column,
                columnGroup: columnGroup,
                providedColumnGroup: providedColumnGroup,
                location: location,
            });

            if (typeof headerValueGetter === 'function') {
                // valueGetter is a function, so just call it
                return headerValueGetter(params);
            } else if (typeof headerValueGetter === 'string') {
                // valueGetter is an expression, so execute the expression
                return this.expressionService.evaluate(headerValueGetter, params);
            }
            _warnOnce('headerValueGetter must be a function or a string');
            return '';
        } else if (colDef.headerName != null) {
            return colDef.headerName;
        } else if ((colDef as ColDef).field) {
            return _camelCaseToHumanText((colDef as ColDef).field);
        }

        return '';
    }

    private wrapHeaderNameWithAggFunc(column: AgColumn, headerName: string | null): string | null {
        if (this.gos.get('suppressAggFuncInHeader')) {
            return headerName;
        }

        // only columns with aggregation active can have aggregations
        const pivotValueColumn = column.getColDef().pivotValueColumn;
        const pivotActiveOnThisColumn = _exists(pivotValueColumn);
        let aggFunc: string | IAggFunc | null | undefined = null;
        let aggFuncFound: boolean;

        // otherwise we have a measure that is active, and we are doing aggregation on it
        if (pivotActiveOnThisColumn) {
            const valueColumns = this.funcColsService.getValueColumns();
            const isCollapsedHeaderEnabled =
                this.gos.get('removePivotHeaderRowWhenSingleValueColumn') && valueColumns.length === 1;
            const isTotalColumn = column.getColDef().pivotTotalColumnIds !== undefined;
            if (isCollapsedHeaderEnabled && !isTotalColumn) {
                return headerName; // Skip decorating the header - in this case the label is the pivot key, not the value col
            }
            aggFunc = pivotValueColumn ? pivotValueColumn.getAggFunc() : null;
            aggFuncFound = true;
        } else {
            const measureActive = column.isValueActive();
            const aggregationPresent = this.columnModel.isPivotMode() || !this.funcColsService.isRowGroupEmpty();

            if (measureActive && aggregationPresent) {
                aggFunc = column.getAggFunc();
                aggFuncFound = true;
            } else {
                aggFuncFound = false;
            }
        }

        if (aggFuncFound) {
            const aggFuncString = typeof aggFunc === 'string' ? aggFunc : 'func';
            const localeTextFunc = this.localeService.getLocaleTextFunc();
            const aggFuncStringTranslated = localeTextFunc(aggFuncString, aggFuncString);
            return `${aggFuncStringTranslated}(${headerName})`;
        }

        return headerName;
    }
}
