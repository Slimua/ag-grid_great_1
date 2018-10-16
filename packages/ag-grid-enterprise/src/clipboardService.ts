import {
    Bean,
    RangeSelection,
    GridCellDef,
    CsvExportParams,
    ColDef,
    IClipboardService,
    Autowired,
    ProcessCellForExportParams,
    CsvCreator,
    LoggerFactory,
    SelectionController,
    IRowModel,
    PinnedRowModel,
    ValueService,
    FocusedCellController,
    RowRenderer,
    ColumnController,
    EventService,
    CellNavigationService,
    GridOptionsWrapper,
    Logger,
    PostConstruct,
    GridRow,
    Utils,
    GridCore,
    GridCell,
    Events,
    RowNode,
    Column,
    Constants,
    FlashCellsEvent,
    _,
    ColumnApi,
    GridApi,
    RowValueChangedEvent,
    ProcessHeaderForExportParams,
    PasteStartEvent,
    PasteEndEvent,
    ProcessDataFromClipboardParams
} from "ag-grid-community";
import {RangeController} from "./rangeController";

interface RowCallback {
    (gridRow: GridRow, rowNode: RowNode, columns: Column[], rangeIndex: number): void;
}

interface ColumnCallback {
    (columns: Column[]): void;
}

@Bean('clipboardService')
export class ClipboardService implements IClipboardService {

    @Autowired('csvCreator') private csvCreator: CsvCreator;
    @Autowired('loggerFactory') private loggerFactory: LoggerFactory;
    @Autowired('selectionController') private selectionController: SelectionController;
    @Autowired('rangeController') private rangeController: RangeController;
    @Autowired('rowModel') private rowModel: IRowModel;
    @Autowired('pinnedRowModel') private pinnedRowModel: PinnedRowModel;
    @Autowired('valueService') private valueService: ValueService;
    @Autowired('focusedCellController') private focusedCellController: FocusedCellController;
    @Autowired('rowRenderer') private rowRenderer: RowRenderer;
    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('eventService') private eventService: EventService;
    @Autowired('cellNavigationService') private cellNavigationService: CellNavigationService;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('gridCore') private gridCore: GridCore;
    @Autowired('columnApi') private columnApi: ColumnApi;
    @Autowired('gridApi') private gridApi: GridApi;

    private logger: Logger;

    @PostConstruct
    private init(): void {
        this.logger = this.loggerFactory.create('ClipboardService');
    }

    public pasteFromClipboard(): void {
        this.logger.log('pasteFromClipboard');

        this.executeOnTempElement(
            (textArea: HTMLTextAreaElement)=> {
                textArea.focus();
            },
            (element: HTMLTextAreaElement)=> {
                let data = element.value;
                if (Utils.missingOrEmpty(data)) return;

                let [parsedData, originalData] = this.dataToArray(data);

                let userFunc = this.gridOptionsWrapper.getProcessDataFromClipboardFunc();
                if (userFunc) {
                    let params: ProcessDataFromClipboardParams = {
                        data: parsedData,
                        originalData: originalData
                    };
                    parsedData = userFunc(params);
                }

                if (Utils.missingOrEmpty(parsedData)) return;

                this.eventService.dispatchEvent(<PasteStartEvent> {
                    type: Events.EVENT_PASTE_START,
                    api: this.gridOptionsWrapper.getApi(),
                    columnApi: this.gridOptionsWrapper.getColumnApi(),
                    source: 'clipboard'
                });

                let singleCellInClipboard = parsedData.length == 1 && parsedData[0].length == 1;
                this.rangeController.isMoreThanOneCell() && !singleCellInClipboard ?
                    this.pasteToRange(parsedData) : this.pasteToSingleCell(parsedData);

                this.eventService.dispatchEvent(<PasteEndEvent> {
                    type: Events.EVENT_PASTE_END,
                    api: this.gridOptionsWrapper.getApi(),
                    columnApi: this.gridOptionsWrapper.getColumnApi(),
                    source: 'clipboard'
                });
            }
        );
    }

    private pasteToRange(clipboardData: string[][]) {

        // remove extra empty row which is inserted when clipboard has more than one row
        if (clipboardData.length > 1) clipboardData.pop();

        let cellsToFlash = <any>{};
        let updatedRowNodes: RowNode[] = [];
        let updatedColumnIds: string[] = [];

        // true if clipboard data can be evenly pasted into range, otherwise false
        let abortRepeatingPasteIntoRows = this.rangeSize() % clipboardData.length != 0;

        let indexOffset = 0, dataRowIndex = 0;
        let rowCallback = (currentRow: GridRow, rowNode: RowNode, columns: Column[], index: number) => {

            let atEndOfClipboardData = index - indexOffset >= clipboardData.length;
            if (atEndOfClipboardData) {
                if(abortRepeatingPasteIntoRows) return;
                // increment offset and reset data index to repeat paste of data
                indexOffset += dataRowIndex;
                dataRowIndex = 0;
            }

            let currentRowData = clipboardData[index - indexOffset];

            // otherwise we are not the first row, so copy
            updatedRowNodes.push(rowNode);
            columns.forEach((column: Column, idx: number) => {
                if (!column.isCellEditable(rowNode)) return;

                // repeat data for columns we don't have data for - happens when to range is bigger than copied data range
                if (idx >= currentRowData.length) {
                    idx = idx % currentRowData.length;
                }

                let firstRowValue = currentRowData[idx];
                let processCellFromClipboardFunc = this.gridOptionsWrapper.getProcessCellFromClipboardFunc();
                firstRowValue = this.userProcessCell(rowNode, column, firstRowValue, processCellFromClipboardFunc, Constants.EXPORT_TYPE_DRAG_COPY);
                this.valueService.setValue(rowNode, column, firstRowValue);

                let gridCellDef = <GridCellDef> {rowIndex: currentRow.rowIndex, floating: currentRow.floating, column: column};
                let cellId = new GridCell(gridCellDef).createId();
                cellsToFlash[cellId] = true;
            });

            ++dataRowIndex;
        };

        this.iterateActiveRanges(false, rowCallback);
        this.rowRenderer.refreshCells({rowNodes: updatedRowNodes, columns: updatedColumnIds});
        this.dispatchFlashCells(cellsToFlash);

        this.fireRowChanged(updatedRowNodes);
    }

    private pasteToSingleCell(parsedData: string[][]) {

        let focusedCell = this.focusedCellController.getFocusedCell();
        if (!focusedCell) { return; }

        // remove last row if empty, excel puts empty last row in
        let lastLine = parsedData[parsedData.length - 1];
        if (lastLine.length===1 && lastLine[0]==='') {
            Utils.removeFromArray(parsedData, lastLine);
        }

        let currentRow = new GridRow(focusedCell.rowIndex, focusedCell.floating);
        let cellsToFlash = <any>{};

        let updatedRowNodes: RowNode[] = [];
        let updatedColumnIds: string[] = [];

        let columnsToPasteInto = this.columnController.getDisplayedColumnsStartingAt(focusedCell.column);

        let onlyOneCellInRange = parsedData.length === 1 && parsedData[0].length === 1;
        if (onlyOneCellInRange) {
            this.singleCellRange(parsedData, updatedRowNodes, currentRow, cellsToFlash, updatedColumnIds);
        } else {
            this.multipleCellRange(parsedData, currentRow, updatedRowNodes, columnsToPasteInto, cellsToFlash, updatedColumnIds, Constants.EXPORT_TYPE_CLIPBOARD);
        }

        // this is very heavy, should possibly just refresh the specific cells?
        this.rowRenderer.refreshCells({rowNodes: updatedRowNodes, columns: updatedColumnIds});

        this.dispatchFlashCells(cellsToFlash);

        this.focusedCellController.setFocusedCell(focusedCell.rowIndex, focusedCell.column, focusedCell.floating, true);

        this.fireRowChanged(updatedRowNodes);
    }

    public copyRangeDown(): void {
        if (this.rangeController.isEmpty()) { return; }

        this.eventService.dispatchEvent( <PasteStartEvent> {
            type: Events.EVENT_PASTE_START,
            api: this.gridOptionsWrapper.getApi(),
            columnApi: this.gridOptionsWrapper.getColumnApi(),
            source: 'rangeDown'
        });

        let cellsToFlash = <any>{};
        let firstRowValues: any[] = null;

        let updatedRowNodes: RowNode[] = [];
        let updatedColumnIds: string[] = [];

        let rowCallback = (currentRow: GridRow, rowNode: RowNode, columns: Column[]) => {
            // take reference of first row, this is the one we will be using to copy from
            if (!firstRowValues) {
                firstRowValues = [];
                // two reasons for looping through columns
                columns.forEach( column => {
                    // reason 1 - to get the initial values to copy down
                    let value = this.valueService.getValue(column, rowNode);
                    let processCellForClipboardFunc = this.gridOptionsWrapper.getProcessCellForClipboardFunc();
                    value = this.userProcessCell(rowNode, column, value, processCellForClipboardFunc, Constants.EXPORT_TYPE_DRAG_COPY);
                    firstRowValues.push(value);
                    // reason 2 - to record the columnId for refreshing
                    updatedColumnIds.push(column.getId());
                });
            } else {
                // otherwise we are not the first row, so copy
                updatedRowNodes.push(rowNode);
                columns.forEach( (column: Column, index: number) => {
                    if (!column.isCellEditable(rowNode)) { return; }

                    let firstRowValue = firstRowValues[index];
                    let processCellFromClipboardFunc = this.gridOptionsWrapper.getProcessCellFromClipboardFunc();
                    firstRowValue = this.userProcessCell(rowNode, column, firstRowValue, processCellFromClipboardFunc, Constants.EXPORT_TYPE_DRAG_COPY);
                    this.valueService.setValue(rowNode, column, firstRowValue);

                    let gridCellDef = <GridCellDef> {rowIndex: currentRow.rowIndex, floating: currentRow.floating, column: column};
                    let cellId = new GridCell(gridCellDef).createId();
                    cellsToFlash[cellId] = true;
                });
            }
        };

        this.iterateActiveRanges(true, rowCallback);

        // this is very heavy, should possibly just refresh the specific cells?
        this.rowRenderer.refreshCells({rowNodes: updatedRowNodes, columns: updatedColumnIds});

        this.dispatchFlashCells(cellsToFlash);

        this.fireRowChanged(updatedRowNodes);

        this.eventService.dispatchEvent( <PasteEndEvent> {
            type: Events.EVENT_PASTE_END,
            api: this.gridOptionsWrapper.getApi(),
            columnApi: this.gridOptionsWrapper.getColumnApi(),
            source: 'rangeDown'
        });
    }

    private fireRowChanged(rowNodes: RowNode[]): void {
        if (!this.gridOptionsWrapper.isFullRowEdit()) {
            return;
        }

        rowNodes.forEach( rowNode => {
            let event: RowValueChangedEvent = {
                type: Events.EVENT_ROW_VALUE_CHANGED,
                node: rowNode,
                data: rowNode.data,
                rowIndex: rowNode.rowIndex,
                rowPinned: rowNode.rowPinned,
                context: this.gridOptionsWrapper.getContext(),
                api: this.gridOptionsWrapper.getApi(),
                columnApi: this.gridOptionsWrapper.getColumnApi()
            };
            this.eventService.dispatchEvent(event);
        });
    }

    private multipleCellRange(clipboardGridData: string[][], currentRow: GridRow, updatedRowNodes: RowNode[], columnsToPasteInto: Column[], cellsToFlash: any, updatedColumnIds: string[], type: string) {
        clipboardGridData.forEach((clipboardRowData: string[]) => {
            // if we have come to end of rows in grid, then skip
            if (!currentRow) {
                return;
            }

            let rowNode = this.getRowNode(currentRow);
            updatedRowNodes.push(rowNode);

            clipboardRowData.forEach((value: any, index: number)=> {
                let column = columnsToPasteInto[index];

                if (Utils.missing(column)) {
                    return;
                }
                if (!column.isCellEditable(rowNode)) {
                    return;
                }

                this.updateCellValue(rowNode, column, value, currentRow, cellsToFlash, updatedColumnIds, type);
            });
            // move to next row down for next set of values
            currentRow = this.cellNavigationService.getRowBelow(currentRow);
        });
        return currentRow;
    }

    private singleCellRange(parsedData: string[][], updatedRowNodes: RowNode[], currentRow: GridRow, cellsToFlash: any, updatedColumnIds: string[]) {
        let value = parsedData[0][0];
        let rowCallback = (gridRow: GridRow, rowNode: RowNode, columns: Column[]) => {
            updatedRowNodes.push(rowNode);
            columns.forEach((column) => {
                if (column.isCellEditable(rowNode)) {
                    this.updateCellValue(rowNode, column, value, currentRow, cellsToFlash, updatedColumnIds, Constants.EXPORT_TYPE_CLIPBOARD);
                }
            });
        };
        this.iterateActiveRanges(false, rowCallback);
    }

    private updateCellValue(rowNode: RowNode, column:Column, value: string, currentRow: GridRow, cellsToFlash: any, updatedColumnIds: string[], type: string) {
        if (column.isSuppressPaste(rowNode)) { return; }

        let processedValue = this.userProcessCell(rowNode, column, value, this.gridOptionsWrapper.getProcessCellFromClipboardFunc(), type);
        this.valueService.setValue(rowNode, column, processedValue);

        let gridCellDef = <GridCellDef> {
            rowIndex: currentRow.rowIndex,
            floating: currentRow.floating,
            column: column
        };
        let cellId = new GridCell(gridCellDef).createId();
        cellsToFlash[cellId] = true;

        if (updatedColumnIds.indexOf(column.getId()) < 0) {
            updatedColumnIds.push(column.getId());
        }
    }

    public copyToClipboard(includeHeaders = false): void {
        this.logger.log(`copyToClipboard: includeHeaders = ${includeHeaders}`);

        let selectedRowsToCopy = !this.selectionController.isEmpty()
            && !this.gridOptionsWrapper.isSuppressCopyRowsToClipboard();

        // default is copy range if exists, otherwise rows
        if (this.rangeController.isMoreThanOneCell()) {
            this.copySelectedRangeToClipboard(includeHeaders);
        } else if (selectedRowsToCopy) {
            // otherwise copy selected rows if they exist
            this.copySelectedRowsToClipboard(includeHeaders);
        } else if (this.focusedCellController.isAnyCellFocused()) {
            // if there is a focused cell, copy this
            this.copyFocusedCellToClipboard(includeHeaders);
        } else {
            // lastly if no focused cell, try range again. this can happen
            // if use has cellSelection turned off (so no focused cell)
            // but has a cell clicked, so there exists a cell range
            // of exactly one cell (hence the first 'if' above didn't
            // get executed).
            this.copySelectedRangeToClipboard(includeHeaders);
        }
    }

    private iterateActiveRanges(onlyFirst: boolean, rowCallback: RowCallback, columnCallback?: ColumnCallback): void {
        if (this.rangeController.isEmpty()) { return; }

        let rangeSelections = this.rangeController.getCellRanges();

        if (onlyFirst) {
            let range = rangeSelections[0];
            this.iterateActiveRange(range, rowCallback, columnCallback);
        } else {
            rangeSelections.forEach( range => this.iterateActiveRange(range, rowCallback, columnCallback) );
        }
    }

    private iterateActiveRange(range: RangeSelection, rowCallback: RowCallback, columnCallback?: ColumnCallback): void {
        // get starting and ending row, remember rowEnd could be before rowStart
        let startRow = range.start.getGridRow();
        let endRow = range.end.getGridRow();

        let startRowIsFirst = startRow.before(endRow);

        let currentRow = startRowIsFirst ? startRow : endRow;
        let lastRow = startRowIsFirst ? endRow : startRow;

        if (Utils.exists(columnCallback)) {
            columnCallback(range.columns);
        }

        let rangeIndex = 0;
        while (true) {

            let rowNode = this.getRowNode(currentRow);
            rowCallback(currentRow, rowNode, range.columns, rangeIndex++);

            if (currentRow.equals(lastRow)) {
                break;
            }

            currentRow = this.cellNavigationService.getRowBelow(currentRow);

            // this can happen if the user sets the active range manually, and sets a range
            // that is outside of the grid, eg sets range rows 0 to 100, but grid has only 20 rows.
            if (_.missing(currentRow)) {
                break;
            }
        }
    }

    public copySelectedRangeToClipboard(includeHeaders = false): void {
        if (this.rangeController.isEmpty()) { return; }

        let deliminator = this.gridOptionsWrapper.getClipboardDeliminator();

        let data = '';
        let cellsToFlash = <any>{};

        // adds columns to the data
        let columnCallback = (columns: Column[]) => {
            if (!includeHeaders) { return; }

            columns.forEach( (column, index) => {
                let value = this.columnController.getDisplayNameForColumn(column, 'clipboard', true);

                let processedValue = this.userProcessHeader(column, value, this.gridOptionsWrapper.getProcessHeaderForClipboardFunc());

                if (index != 0) {
                    data += deliminator;
                }
                if (Utils.exists(processedValue)) {
                    data += processedValue;
                }
            });
            data += '\r\n';
        };

        // adds cell values to the data
        let rowCallback = (currentRow: GridRow, rowNode: RowNode, columns: Column[]) => {
            columns.forEach( (column, index) => {
                let value = this.valueService.getValue(column, rowNode);

                let processedValue = this.userProcessCell(rowNode, column, value, this.gridOptionsWrapper.getProcessCellForClipboardFunc(), Constants.EXPORT_TYPE_CLIPBOARD);

                if (index != 0) {
                    data += deliminator;
                }
                if (Utils.exists(processedValue)) {
                    data += processedValue;
                }
                let gridCellDef = <GridCellDef> {rowIndex: currentRow.rowIndex, floating: currentRow.floating, column: column};
                let cellId = new GridCell(gridCellDef).createId();
                cellsToFlash[cellId] = true;
            });
            data += '\r\n';
        };

        this.iterateActiveRanges(false, rowCallback, columnCallback);
        this.copyDataToClipboard(data);
        this.dispatchFlashCells(cellsToFlash);
    }

    private copyFocusedCellToClipboard(includeHeaders = false): void {
        let focusedCell = this.focusedCellController.getFocusedCell();
        if (Utils.missing(focusedCell)) { return; }

        let currentRow = focusedCell.getGridRow();
        let rowNode = this.getRowNode(currentRow);
        let column = focusedCell.column;
        let value = this.valueService.getValue(column, rowNode);

        let processedValue = this.userProcessCell(rowNode, column, value, this.gridOptionsWrapper.getProcessCellForClipboardFunc(), Constants.EXPORT_TYPE_CLIPBOARD);

        if (_.missing(processedValue)) {
            // copy the new line character to clipboard instead of an empty string, as the 'execCommand' will ignore it.
            // this behaviour is consistent with how Excel works!
            processedValue = '\n';
        }

        let data = '';
        if (includeHeaders) {
            data = this.columnController.getDisplayNameForColumn(column, 'clipboard', true) + '\r\n';
        }
        data += processedValue.toString();

        this.copyDataToClipboard(data);

        let cellId = focusedCell.createId();
        let cellsToFlash = {};
        (<any>cellsToFlash)[cellId] = true;
        this.dispatchFlashCells(cellsToFlash);
    }

    private dispatchFlashCells(cellsToFlash: {}): void {
        setTimeout( ()=> {
            let event: FlashCellsEvent = {
                type: Events.EVENT_FLASH_CELLS,
                cells: cellsToFlash,
                api: this.gridApi,
                columnApi: this.columnApi
            };
            this.eventService.dispatchEvent(event);
        }, 0);
    }

    private userProcessCell(rowNode: RowNode, column: Column, value: any, func: (params: ProcessCellForExportParams) => void, type: string ): any {
        if (func) {
            let params = {
                column: column,
                node: rowNode,
                value: value,
                api: this.gridOptionsWrapper.getApi(),
                columnApi: this.gridOptionsWrapper.getColumnApi(),
                context: this.gridOptionsWrapper.getContext(),
                type: type
            };
            return func(params);
        } else {
            return value;
        }
    }

    private userProcessHeader(column: Column, value: any, func: (params: ProcessHeaderForExportParams) => void): any {
        if (func) {
            let params: ProcessHeaderForExportParams = {
                column: column,
                api: this.gridOptionsWrapper.getApi(),
                columnApi: this.gridOptionsWrapper.getColumnApi(),
                context: this.gridOptionsWrapper.getContext()
            };
            return func(params);
        } else {
            return value;
        }
    }

    private getRowNode(gridRow: GridRow): RowNode {
        switch (gridRow.floating) {
            case Constants.PINNED_TOP:
                return this.pinnedRowModel.getPinnedTopRowData()[gridRow.rowIndex];
            case Constants.PINNED_BOTTOM:
                return this.pinnedRowModel.getPinnedBottomRowData()[gridRow.rowIndex];
            default:
                return this.rowModel.getRow(gridRow.rowIndex);
        }
    }

    public copySelectedRowsToClipboard(includeHeaders = false, columnKeys?: (string|Column)[]): void {

        let skipHeader = !includeHeaders;
        let deliminator = this.gridOptionsWrapper.getClipboardDeliminator();

        let params: CsvExportParams = {
            columnKeys: columnKeys,
            skipHeader: skipHeader,
            skipFooters: true,
            suppressQuotes: true,
            columnSeparator: deliminator,
            onlySelected: true,
            processCellCallback: this.gridOptionsWrapper.getProcessCellForClipboardFunc(),
            processHeaderCallback: this.gridOptionsWrapper.getProcessHeaderForClipboardFunc()
        };

        let data = this.csvCreator.getDataAsCsv(params);

        this.copyDataToClipboard(data);
    }

    private copyDataToClipboard(data: string): void {
        let userProvidedFunc = this.gridOptionsWrapper.getSendToClipboardFunc();
        if (Utils.exists(userProvidedFunc)) {
            let params = {data: data};
            userProvidedFunc(params);
        } else {
            this.executeOnTempElement( (element: HTMLTextAreaElement)=> {
                element.value = data;
                element.select();
                element.focus();
                let result = document.execCommand('copy');

                if (!result) {
                    console.warn('ag-grid: Browser did not allow document.execCommand(\'copy\'). Ensure ' +
                        'api.copySelectedRowsToClipboard() is invoked via a user event, i.e. button click, otherwise ' +
                        'the browser will prevent it for security reasons.');
                }
            });
        }
    }

    private executeOnTempElement(
        callbackNow: (element: HTMLTextAreaElement)=>void,
        callbackAfter?: (element: HTMLTextAreaElement)=>void): void {

        let eTempInput = <HTMLTextAreaElement> document.createElement('textarea');
        eTempInput.style.width = '1px';
        eTempInput.style.height = '1px';
        eTempInput.style.top = '0px';
        eTempInput.style.left = '0px';
        eTempInput.style.position = 'absolute';
        eTempInput.style.opacity = '0.0';

        let guiRoot = this.gridCore.getRootGui();

        guiRoot.appendChild(eTempInput);

        try {
            callbackNow(eTempInput);
        } catch (err) {
            console.warn('ag-grid: Browser does not support document.execCommand(\'copy\') for clipboard operations');
        }

        //It needs 100 otherwise OS X seemed to not always be able to paste... Go figure...
        if (callbackAfter) {
            setTimeout( ()=> {
                callbackAfter(eTempInput);
                guiRoot.removeChild(eTempInput);
            }, 100);
        } else {
            guiRoot.removeChild(eTempInput);
        }
    }

    // From http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
    // This will parse a delimited string into an array of arrays.
    // Note: this code fixes an issue with the example posted on stack overflow where it doesn't correctly handle
    // empty values in the first cell.
    private dataToArray(strData: string): [string[][], string[][]] {
        let delimiter = this.gridOptionsWrapper.getClipboardDeliminator();

        // Create a regular expression to parse the CSV values.
        // Capture group 2 will get both quoted, and unquoted values,
        // users are now responsible for replacing any quotes lost using processDataForClipboard,
        // for that purpose, the method will return both parsed (quote removed) & orignal (quote kept) data.
        let objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
                // Values
                "([^\\" + delimiter + "\\r\\n]*)"
            ),
            "gi"
        );

        // Create two arrays to hold our parsed and original data.
        // Give the arrays a default empty first row.
        let parsedData: string[][] = [[]];
        let originalData: string[][] = [[]];

        // Create an array to hold our individual pattern matching groups.
        let arrMatches: string[];

        // Required for handling edge case on first row copy
        let atFirstRow = true;

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )) {

            // Get the delimiter that was found.
            let strMatchedDelimiter = arrMatches[ 1 ];

            // Handles case when first row is an empty cell, insert an empty string before delimiter
            if (atFirstRow && strMatchedDelimiter) {
                parsedData[0].push("");
                originalData[0].push("");
            }

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (strMatchedDelimiter.length && strMatchedDelimiter !== delimiter) {
                // Since we have reached a new row of data,
                // add an empty row to our data array.
                parsedData.push( [] );
                originalData.push( [] );
            }

            let strMatchedValue: string = arrMatches[2] ? arrMatches[2] : "";

            // Now that we have our delimiter out of the way,
            // We need to remove any quotes from the value,
            // then add it to the data array.
            parsedData[ parsedData.length - 1 ].push(strMatchedValue.replace(/["]/g, ""));
            originalData[ originalData.length - 1 ].push(strMatchedValue);

            atFirstRow = false;
        }

        // Return a Tuple of the parsedData, and original captured data.
        return [parsedData, originalData];
    }

    private rangeSize() {
        let ranges = this.rangeController.getCellRanges();
        let [startRange, endRange] = [ranges[0].start.rowIndex, ranges[0].end.rowIndex];
        return (startRange > endRange ? startRange - endRange : endRange - startRange) + 1;
    }
}