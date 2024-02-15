/* eslint-disable */
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { AgGridReact } from '@ag-grid-community/react';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';
import '@ag-grid-community/styles/ag-theme-balham.css';
import '@ag-grid-community/styles/ag-theme-material.css';
import { GridChartsModule } from '@ag-grid-enterprise/charts-enterprise';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { MasterDetailModule } from '@ag-grid-enterprise/master-detail';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { MultiFilterModule } from '@ag-grid-enterprise/multi-filter';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { SideBarModule } from '@ag-grid-enterprise/side-bar';
import { SparklinesModule } from '@ag-grid-enterprise/sparklines';
import { StatusBarModule } from '@ag-grid-enterprise/status-bar';
import classnames from 'classnames';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { booleanValues, colNames, countries, COUNTRY_CODES, firstNames, games, lastNames, months, LANGUAGES, COUNTRY_NAMES } from './consts';
import styles from '@design-system/modules/Example.module.scss';
import { Toolbar } from './Toolbar';
import {
    axisLabelFormatter,
    createDataSizeValue,
    currencyFormatter,
    formatThousands,
    pseudoRandom,
    suppressColumnMoveAnimation,
} from './utils';

import { useGlobalContext } from 'components/GlobalContext';

const IS_SSR = typeof window === 'undefined';

const helmet = [];

const AgGridReactMemo = memo(AgGridReact);

const groupColumn = {
    headerName: 'Group',
    width: 250,
    field: 'name',
    headerCheckboxSelection: true,
    headerCheckboxSelectionFilteredOnly: true,
    cellRendererParams: {
        checkbox: true,
    },
};

function currencyCssFunc(params) {
    if (params.value != null && params.value < 0) {
        return { color: 'red', fontWeight: 'bold' };
    }
    return {};
}

export class CountryCellRendererJs {
    eGui;

    init(params) {
        this.eGui = document.createElement('span');
        this.eGui.style.cursor = 'default';
        this.eGui.style.overflow = 'hidden';
        this.eGui.style.textOverflow = 'ellipsis';

        if (params.value === undefined) {
            return null;
        } else if (params.value == null || params.value === '' || params.value === '(Select All)') {
            this.eGui.innerHTML = params.value;
        } else {
            // Get flags from here: http://www.freeflagicons.com/
            var flag = `<img border="0" width="15" height="10" alt="${
                params.value
            } flag"  src="https://flags.fmcdn.net/data/flags/mini/${COUNTRY_CODES[params.value]}.png">`;
            this.eGui.innerHTML = flag + ' ' + params.value;
        }
    }

    getGui() {
        return this.eGui;
    }

    refresh() {
        return false;
    }
}

function ratingRenderer(params) {
    const { value } = params;
    if (value === '(Select All)') {
        return value;
    } else if (params.isFilterRenderer && value === 0) {
        return '(No stars)';
    }

    return (
        <span>
            {[...Array(5)].map((x, i) => {
                return value > i ? (
                    <img className={styles.starIcon} key={i} src="../images/star.svg" alt={`${value} stars`} width="12" height="12" />
                ) : null;
            })}
        </span>
    );
}

const booleanCellRenderer = ({ value, isFilterRenderer }) => {
    if (value === true) {
        return <span title="true" className="ag-icon ag-icon-tick content-icon" />;
    }
    if (value === false) {
        return <span title="false" className="ag-icon ag-icon-cross content-icon" />;
    }
    if (isFilterRenderer) {
        if (value === '(Select All)') {
            return value;
        }
        return '(empty)';
    } else {
        return null;
    }

};

const mobileDefaultCols = [
    {
        rowDrag: true,
        field: 'name',
        width: 200,
        cellClass: 'v-align',
        checkboxSelection: (params) => {
            // we put checkbox on the name if we are not doing grouping
            return params.api.getRowGroupColumns().length === 0;
        },
        headerCheckboxSelection: (params) => {
            // we put checkbox on the name if we are not doing grouping
            return params.api.getRowGroupColumns().length === 0;
        },
        headerCheckboxSelectionFilteredOnly: true,
    },
    {
        field: 'language',
        width: 150,
        filter: 'agSetColumnFilter',
        cellEditor: 'agRichSelectCellEditor',
        cellClass: 'v-align',
        cellEditorParams: {
            values: LANGUAGES,
        },
    },
    {
        field: 'country',
        width: 150,
        cellRenderer: 'countryCellRenderer',
        cellClass: 'v-align',
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: {
            cellRenderer: 'countryCellRenderer',
            values: COUNTRY_NAMES,
        },
    },
    {
        field: 'game.name',
        width: 180,
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: {
            values: [...games].sort()
        },
        filter: 'agSetColumnFilter',
        cellClass: () => 'alphabet',
    },
    {
        field: 'bankBalance',
        width: 180,
        cellClassRules: {
            'currency-cell': 'typeof x == "number"',
        },
        enableValue: true,
        cellDataType: 'currency',
        filter: 'agNumberColumnFilter',
    },
    {
        field: 'totalWinnings',
        filter: 'agNumberColumnFilter',
        width: 170,
        enableValue: true,
        cellClassRules: {
            'currency-cell': 'typeof x == "number"',
        },
        cellStyle: currencyCssFunc,
        cellDataType: 'currency',
    },
];

const desktopDefaultCols = [
    {
        headerName: 'Participant',
        children: [
            {
                rowDrag: true,
                field: 'name',
                width: 200,
                enableRowGroup: true,
                cellClass: 'v-align',
                checkboxSelection: (params) => {
                    // we put checkbox on the name if we are not doing grouping
                    return params.api.getRowGroupColumns().length === 0;
                },
                headerCheckboxSelection: (params) => {
                    // we put checkbox on the name if we are not doing grouping
                    return params.api.getRowGroupColumns().length === 0;
                },
                headerCheckboxSelectionFilteredOnly: true,
            },
            {
                field: 'language',
                width: 150,
                cellEditor: 'agRichSelectCellEditor',
                cellClass: 'v-align',
                enableRowGroup: true,
                enablePivot: true,
                cellEditorParams: {
                    values: LANGUAGES,
                },
                filter: 'agMultiColumnFilter',
                filterParams: {
                    filters: [
                        {
                            filter: 'agTextColumnFilter',
                            display: 'subMenu',
                        },
                        {
                            filter: 'agSetColumnFilter',
                            filterParams: {
                                buttons: ['reset'],
                            },
                        },
                    ],
                },
            },
            {
                field: 'country',
                width: 150,
                cellRenderer: 'countryCellRenderer',
                cellClass: ['country-cell', 'v-align'],
                enableRowGroup: true,
                enablePivot: true,
                cellEditor: 'agRichSelectCellEditor',
                cellEditorParams: {
                    cellRenderer: 'countryCellRenderer',
                    values: COUNTRY_NAMES,
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    cellRenderer: 'countryCellRenderer',
                    buttons: ['reset'],
                },
            },
        ],
    },
    {
        headerName: 'Game of Choice',
        children: [
            {
                field: 'game.name',
                width: 180,
                filter: 'agMultiColumnFilter',
                cellEditor: 'agRichSelectCellEditor',
                cellEditorParams: {
                    values: [...games].sort(),
                    allowTyping: true,
                    searchType: 'matchAny',
                    filterList: true,
                    highlightMatch: true
                },
                tooltipField: 'game.name',
                cellClass: () => 'alphabet',
                filterParams: {
                    filters: [
                        {
                            filter: 'agTextColumnFilter',
                            display: 'subMenu',
                        },
                        {
                            filter: 'agSetColumnFilter',
                            filterParams: {
                                buttons: ['reset'],
                            },
                        },
                    ],
                },
                enableRowGroup: true,
                enablePivot: true,
            },
            {
                headerName: 'Bought',
                field: 'game.bought',
                filter: 'agSetColumnFilter',
                width: 150,
                enableRowGroup: true,
                enablePivot: true,
                cellClass: 'boolean-type',
                cellRenderer: 'booleanCellRenderer',
                cellStyle: { textAlign: 'center' },
                filterParams: {
                    cellRenderer: 'booleanCellRenderer',
                    cellRendererParams: { isFilterRenderer: true },
                    buttons: ['reset'],
                },
            },
        ],
    },
    {
        headerName: 'Performance',
        groupId: 'performance',
        children: [
            {
                field: 'bankBalance',
                width: 180,
                cellClassRules: {
                    'currency-cell': 'typeof x == "number"',
                },
                enableValue: true,
                cellDataType: 'currency',
                filter: 'agNumberColumnFilter',
            },
            {
                colId: 'extraInfo1',
                headerName: 'Extra Info 1',
                columnGroupShow: 'open',
                width: 150,
                editable: false,
                suppressHeaderMenuButton: true,
                suppressHeaderContextMenu: true,
                cellStyle: { textAlign: 'right' },
                valueGetter: () => 'Abra...',
            },
            {
                colId: 'extraInfo2',
                headerName: 'Extra Info 2',
                columnGroupShow: 'open',
                width: 150,
                editable: false,
                suppressHeaderMenuButton: true,
                suppressHeaderContextMenu: true,
                cellStyle: { textAlign: 'left' },
                valueGetter: () => '...cadabra!',
            },
        ],
    },
    {
        field: 'rating',
        width: 120,
        cellRenderer: 'ratingRenderer',
        cellClass: 'v-align',
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
        chartDataType: 'category',
        filterParams: { cellRenderer: 'ratingRenderer', cellRendererParams: { isFilterRenderer: true } },
    },
    {
        field: 'totalWinnings',
        filter: 'agNumberColumnFilter',
        width: 200,
        enableValue: true,
        cellClassRules: {
            'currency-cell': 'typeof x == "number"',
        },
        cellDataType: 'currency',
        cellStyle: currencyCssFunc,
    },
];

const ExampleInner = ({darkMode}) => {
    const gridRef = useRef(null);
    const loadInstance = useRef(0);
    const [gridTheme, setGridTheme] = useState('quartz');
    useEffect(() => {
        const themeFromURL = new URLSearchParams(window.location.search).get('theme');
        if (themeFromURL) {
            setGridTheme(themeFromURL);
        }
    }, []);
    const [base64Flags, setBase64Flags] = useState();
    const [defaultCols, setDefaultCols] = useState();
    const [isSmall, setIsSmall] = useState(false);
    const [defaultColCount, setDefaultColCount] = useState();
    const [columnDefs, setColumnDefs] = useState();
    const [rowData, setRowData] = useState();
    const [message, setMessage] = useState();
    const [showMessage, setShowMessage] = useState(false);
    const [rowCols, setRowCols] = useState([]);
    const [dataSize, setDataSize] = useState();

    const modules = useMemo(
        () => [
            ClientSideRowModelModule,
            CsvExportModule,
            ClipboardModule,
            ColumnsToolPanelModule,
            ExcelExportModule,
            FiltersToolPanelModule,
            GridChartsModule,
            MasterDetailModule,
            MenuModule,
            MultiFilterModule,
            RangeSelectionModule,
            RichSelectModule,
            RowGroupingModule,
            SetFilterModule,
            SideBarModule,
            StatusBarModule,
            SparklinesModule,
        ],
        []
    );

    const defaultExportParams = useMemo(
        () => ({
            headerRowHeight: 40,
            rowHeight: 30,
            fontSize: 14,
            addImageToCell: (rowIndex, column, value) => {
                if (column.colId === 'country') {
                    return {
                        image: {
                            id: value,
                            base64: base64Flags[COUNTRY_CODES[value]],
                            imageType: 'png',
                            width: 20,
                            height: 12,
                            position: {
                                offsetX: 17,
                                offsetY: 14,
                            },
                        },
                        value: value,
                    };
                }
            },
        }),
        [base64Flags]
    );

    const gridOptions = useMemo(
        () => ({
            statusBar: {
                statusPanels: [
                    { statusPanel: 'agTotalAndFilteredRowCountComponent', key: 'totalAndFilter', align: 'left' },
                    { statusPanel: 'agSelectedRowCountComponent', align: 'left' },
                    { statusPanel: 'agAggregationComponent', align: 'right' },
                ],
            },
            components: {
                countryCellRenderer: CountryCellRendererJs,
                booleanCellRenderer: booleanCellRenderer,
                ratingRenderer: ratingRenderer,
            },
            defaultColDef: {
                minWidth: 50,
                editable: true,
                filter: true,
                floatingFilter: !isSmall,
            },
            enableCellChangeFlash: true,
            rowDragManaged: true,
            rowDragMultiRow: true,
            popupParent: IS_SSR ? null : document.querySelector('#example-wrapper'),
            rowGroupPanelShow: isSmall ? undefined : 'always',
            pivotPanelShow: 'always',
            enterNavigatesVerticallyAfterEdit: true,
            enterNavigatesVertically: true,
            suppressColumnMoveAnimation: suppressColumnMoveAnimation(),
            enableRtl: IS_SSR ? false : /[?&]rtl=true/.test(window.location.search),
            enableCharts: true,
            enableRangeSelection: true,
            enableFillHandle: true,
            undoRedoCellEditing: true,
            undoRedoCellEditingLimit: 50,
            suppressClearOnFillReduction: false,
            rowSelection: 'multiple',
            quickFilterText: null,
            groupSelectsChildren: true,
            suppressRowClickSelection: true,
            autoGroupColumnDef: groupColumn,
            sideBar: {
                toolPanels: ['columns', 'filters'],
                position: 'right',
                defaultToolPanel: 'columns',
                hiddenByDefault: isSmall,
            },
            columnMenu: 'new',
            dataTypeDefinitions: {
                currency: {
                    extendsDataType: 'number',
                    baseDataType: 'number',
                    valueFormatter: currencyFormatter,
                    valueParser: params => {
                        let newValue = params.newValue?.trim?.();
                        if (newValue == null || newValue === '') {
                            return null
                        }
                        newValue = newValue.replace('$', '').replace(',', '');
                        if (newValue.includes('(')) {
                            newValue = newValue.replace('(').replace(')');
                            newValue = '-' + newValue;
                        }
                        return Number(newValue);
                    },
                    columnTypes: ['currencyType', 'numericColumn'],
                }
            },
            columnTypes: {
                currencyType: {
                    useValueFormatterForExport: false,
                    // useValueParserForImport: false,
                    valueFormatter: currencyFormatter,
                }
            },
            getBusinessKeyForNode: (node) => (node.data ? node.data.name : ''),
            initialGroupOrderComparator: ({ nodeA, nodeB }) => {
                if (nodeA.key < nodeB.key) {
                    return -1;
                }
                if (nodeA.key > nodeB.key) {
                    return 1;
                }

                return 0;
            },
            onGridReady: (event) => {
                if (!IS_SSR && document.documentElement.clientWidth <= 1024) {
                    event.api.closeToolPanel();
                }
            },
            chartThemeOverrides: {
                polar: {
                    series: {
                        pie: {
                            calloutLabel: {
                                enabled: false,
                            },
                            tooltip: {
                                renderer: (params) => ({
                                    content: '$' + formatThousands(Math.round(params.datum[params.angleKey])),
                                }),
                            },
                        },
                    },
                },
                cartesian: {
                    axes: {
                        number: {
                            label: {
                                formatter: axisLabelFormatter,
                            },
                        },
                    },
                    series: {
                        column: {
                            tooltip: {
                                renderer: (params) => ({
                                    content: '$' + formatThousands(Math.round(params.datum[params.yKey])),
                                }),
                            },
                        },
                        bar: {
                            tooltip: {
                                renderer: (params) => ({
                                    content: '$' + formatThousands(Math.round(params.datum[params.yKey])),
                                }),
                            },
                        },
                        line: {
                            tooltip: {
                                renderer: (params) => ({
                                    content: '$' + formatThousands(Math.round(params.datum[params.yKey])),
                                }),
                            },
                        },
                        area: {
                            tooltip: {
                                renderer: (params) => ({
                                    content: '$' + formatThousands(Math.round(params.datum[params.yKey])),
                                }),
                            },
                        },
                        scatter: {
                            tooltip: {
                                renderer: (params) => {
                                    const label = params.labelKey ? params.datum[params.labelKey] + '<br>' : '';
                                    const xValue = params.xName + ': $' + formatThousands(params.datum[params.xKey]);
                                    const yValue = params.yName + ': $' + formatThousands(params.datum[params.yKey]);
                                    let size = '';
                                    if (params.sizeKey) {
                                        size =
                                            '<br>' +
                                            params.sizeName +
                                            ': $' +
                                            formatThousands(params.datum[params.sizeKey]);
                                    }
                                    return {
                                        content: label + xValue + '<br>' + yValue + size,
                                    };
                                },
                            },
                        },
                        histogram: {
                            tooltip: {
                                renderer: (params) => ({
                                    title:
                                        (params.xName || params.xKey) +
                                        ': $' +
                                        formatThousands(params.datum.domain[0]) +
                                        ' - $' +
                                        formatThousands(params.datum.domain[1]),
                                    // With a yKey, the value is the total of the yKey value for the population of the bin.
                                    // Without a yKey, the value is a count of the population of the bin.
                                    content: params.yKey
                                        ? formatThousands(Math.round(params.datum.total))
                                        : params.datum.frequency,
                                }),
                            },
                        },
                    },
                },
            },
            excelStyles: [
                {
                    id: 'v-align',
                    alignment: {
                        vertical: 'Center',
                    },
                },
                {
                    id: 'alphabet',
                    alignment: {
                        vertical: 'Center',
                    },
                },
                {
                    id: 'good-score',
                    alignment: {
                        horizontal: 'Center',
                        vertical: 'Center',
                    },
                    interior: {
                        color: '#C6EFCE',
                        pattern: 'Solid',
                    },
                    numberFormat: {
                        format: '[$$-409]#,##0',
                    },
                },
                {
                    id: 'bad-score',
                    alignment: {
                        horizontal: 'Center',
                        vertical: 'Center',
                    },
                    interior: {
                        color: '#FFC7CE',
                        pattern: 'Solid',
                    },
                    numberFormat: {
                        format: '[$$-409]#,##0',
                    },
                },
                {
                    id: 'header',
                    font: {
                        color: '#44546A',
                        size: 16,
                    },
                    interior: {
                        color: '#F2F2F2',
                        pattern: 'Solid',
                    },
                    alignment: {
                        horizontal: 'Center',
                        vertical: 'Center',
                    },
                    borders: {
                        borderTop: {
                            lineStyle: 'Continuous',
                            weight: 0,
                            color: '#8EA9DB',
                        },
                        borderRight: {
                            lineStyle: 'Continuous',
                            weight: 0,
                            color: '#8EA9DB',
                        },
                        borderBottom: {
                            lineStyle: 'Continuous',
                            weight: 0,
                            color: '#8EA9DB',
                        },
                        borderLeft: {
                            lineStyle: 'Continuous',
                            weight: 0,
                            color: '#8EA9DB',
                        },
                    },
                },
                {
                    id: 'currency-cell',
                    alignment: {
                        horizontal: 'Center',
                        vertical: 'Center',
                    },
                    numberFormat: {
                        format: '[$$-409]#,##0',
                    },
                },
                {
                    id: 'boolean-type',
                    dataType: 'boolean',
                    alignment: {
                        vertical: 'Center',
                    },
                },
                {
                    id: 'country-cell',
                    alignment: {
                        indent: 4,
                    },
                },
            ]
        }),
        [isSmall]
    );

    const createRowItem = (row, colCount) => {
        const rowItem = {};

        //create data for the known columns
        const countriesToPickFrom = Math.floor(countries.length * (((row % 3) + 1) / 3));
        const countryData = countries[(row * 19) % countriesToPickFrom];
        rowItem.country = countryData.country;
        rowItem.language = countryData.language;

        const firstName = firstNames[row % firstNames.length];
        const lastName = lastNames[row % lastNames.length];
        rowItem.name = firstName + ' ' + lastName;

        rowItem.game = {
            name: games[Math.floor(((row * 13) / 17) * 19) % games.length],
            bought: booleanValues[row % booleanValues.length],
        };

        rowItem.bankBalance = Math.round(pseudoRandom() * 100000) - 3000;
        rowItem.rating = Math.round(pseudoRandom() * 5);

        let totalWinnings = 0;
        months.forEach((month) => {
            const value = Math.round(pseudoRandom() * 100000) - 20;
            rowItem[month.toLocaleLowerCase()] = value;
            totalWinnings += value;
        });
        rowItem.totalWinnings = totalWinnings;

        for (let i = defaultCols.length; i < defaultColCount; i++) {
            // there was a bug in the old row generation logic which has since been fixed.
            // However, a side effect of this is that the number of calls to `pseudoRandom` changed,
            // so we need to call it that many times here to keep the numbers the same.
            pseudoRandom();
        }

        //create dummy data for the additional columns
        for (let col = defaultColCount; col < colCount; col++) {
            var value;
            const randomBit = pseudoRandom().toString().substring(2, 5);
            value = colNames[col % colNames.length] + '-' + randomBit + ' - (' + (row + 1) + ',' + col + ')';
            rowItem['col' + col] = value;
        }

        return rowItem;
    };

    const createData = () => {
        loadInstance.current = loadInstance.current + 1;
        const loadInstanceCopy = loadInstance.current;

        if (gridRef.current && gridRef.current.api) {
            gridRef.current.api.showLoadingOverlay();
        }

        const colDefs = createCols();

        const rowCount = getRowCount();
        const colCount = getColCount();

        let row = 0;
        const data = [];

        setShowMessage(true);
        setMessage(` Generating rows`);

        const loopCount = rowCount > 10000 ? 10000 : 1000;

        const intervalId = setInterval(() => {
            if (loadInstanceCopy !== loadInstance.current) {
                clearInterval(intervalId);
                return;
            }

            for (let i = 0; i < loopCount; i++) {
                if (row < rowCount) {
                    const rowItem = createRowItem(row, colCount);
                    data.push(rowItem);
                    row++;
                } else {
                    break;
                }
            }

            setMessage(` Generating rows ${row}`);

            if (row >= rowCount) {
                setShowMessage(false);
                setMessage('');
                clearInterval(intervalId);
                setColumnDefs(colDefs);
                setRowData(data);
            }
        }, 0);
    };

    const setCountryColumnPopupEditor = (theme, gridApi) => {
        if (!columnDefs) {
            return
        }
        const participantGroup = columnDefs.find(group => group.headerName === 'Participant');
        if (!gridApi || !participantGroup) {
            return
        }

        const countryColumn = participantGroup.children.find(column => column.field === 'country')
        countryColumn['cellEditorPopup'] = theme.includes('material') ? true : false;

        setColumnDefs(columnDefs);
    }

    useEffect(() => {
        const small = IS_SSR
            ? false
            : document.documentElement.clientHeight <= 415 || document.documentElement.clientWidth < 768;
        setIsSmall(small);

        //put in the month cols
        const monthGroup = {
            headerName: 'Monthly Breakdown',
            children: [],
        };

        months.forEach((month) => {
            monthGroup.children.push({
                field: month.toLocaleLowerCase(),
                width: 150,
                enableValue: true,
                cellClassRules: {
                    'good-score': 'typeof x === "number" && x > 50000',
                    'bad-score': 'typeof x === "number" && x < 10000',
                    'currency-cell': 'typeof x === "number" && x >= 10000 && x <= 50000',
                },
                cellDataType: 'currency',
                filter: 'agNumberColumnFilter',
                filterParams: {
                    buttons: ['reset'],
                    inRangeInclusive: true,
                },
            });
        });

        let defaultCols;
        let defaultColCount;
        if (small) {
            defaultCols = mobileDefaultCols;
            defaultCols = defaultCols.concat(monthGroup.children);
            defaultColCount = defaultCols.length;
        } else {
            defaultCols = desktopDefaultCols;
            defaultCols.push(monthGroup);
            defaultColCount = 22;
        }

        setDefaultCols(defaultCols);
        setDefaultColCount(defaultColCount);

        const newRowsCols = [
            [100, defaultColCount],
            [1000, defaultColCount],
        ];

        if (!small) {
            newRowsCols.push([10000, 100], [50000, defaultColCount], [100000, defaultColCount]);
        }

        setDataSize(createDataSizeValue(newRowsCols[0][0], newRowsCols[0][1]));
        setRowCols(newRowsCols);
    }, []);

    useEffect(() => {
        const flags = {};
        const promiseArray = countries.map((country) => {
            const countryCode = COUNTRY_CODES[country.country];

            return fetch(`https://flagcdn.com/w20/${countryCode}.png`)
                .then((response) => response.blob())
                .then(
                    (blob) =>
                        new Promise((res) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                flags[countryCode] = reader.result;
                                res(reader.result);
                            };
                            reader.readAsDataURL(blob);
                        })
                );
        });

        Promise.all(promiseArray).then(() => setBase64Flags(flags));
    }, []);

    const getColCount = () => {
        return parseInt(dataSize.split('x')[1], 10);
    };

    const getRowCount = () => {
        const rows = parseFloat(dataSize.split('x')[0]);

        return rows * 1000;
    };

    const createCols = () => {
        const colCount = getColCount();
        // start with a copy of the default cols
        const columns = defaultCols.slice(0, colCount);

        for (let col = defaultColCount; col < colCount; col++) {
            const colName = colNames[col % colNames.length];
            const colDef = { headerName: colName, field: 'col' + col, width: 200, editable: true };
            columns.push(colDef);
        }

        return columns;
    };

    useEffect(() => {
        if (dataSize) {
            createData();
        }
    }, [dataSize]);

    const isAutoTheme = gridTheme.includes('auto');
    let themeClass = gridTheme;
    if (!themeClass.startsWith('ag-theme-')) {
        themeClass = 'ag-theme-' + themeClass;
        if (darkMode && themesWithDarkVariant.includes(themeClass)) {
            themeClass += '-dark';
        }
    }
    const isDarkTheme = themeClass.includes('dark');

    const defaultChartThemes = ['ag-default', 'ag-material', 'ag-sheets', 'ag-polychroma', 'ag-vivid'];
    const [chartThemes, setChartThemes] = useState(defaultChartThemes);
    useEffect(() => {
        setChartThemes(darkMode ? defaultChartThemes.map(theme => theme + '-dark') : defaultChartThemes);
    }, [darkMode]);

    return (
        <>
            <Helmet>
                <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" />
                {helmet.map((entry) => entry)}
            </Helmet>
            <div className={styles.exampleWrapper}>
                <Toolbar
                    gridRef={gridRef}
                    dataSize={dataSize}
                    setDataSize={setDataSize}
                    rowCols={rowCols}
                    gridTheme={gridTheme}
                    setGridTheme={setGridTheme}
                    setCountryColumnPopupEditor={setCountryColumnPopupEditor}
                />
                <span className={classnames({ [styles.messages]: true, [styles.show]: showMessage })}>
                    {message}
                    <i className="fa fa-spinner fa-pulse fa-fw margin-bottom" />
                </span>
                <section className={styles.gridWrapper}>
                    {gridTheme && (
                        <div id="myGrid" style={{ flex: '1 1 auto', overflow: 'hidden' }} className={themeClass}>
                            <AgGridReactMemo
                                ref={gridRef}
                                modules={modules}
                                gridOptions={gridOptions}
                                columnDefs={columnDefs}
                                chartThemes={chartThemes}
                                rowData={rowData}
                                defaultCsvExportParams={defaultExportParams}
                                defaultExcelExportParams={defaultExportParams}
                            />
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

const themesWithDarkVariant = ['ag-theme-quartz', 'ag-theme-alpine', 'ag-theme-balham']

const Example = () => {
    const { darkMode } = useGlobalContext();
    return <ExampleInner darkMode={darkMode} />
}

export default Example;
