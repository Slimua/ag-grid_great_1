import { ICellEditorParams } from "./iCellEditor";

export interface IRichCellEditorParams<TValue = any> {
    /** The list of values to be selected from. */
    values: TValue[];
    /** The row height, in pixels, of each value. */
    cellHeight: number;
    /** The cell renderer to use to render each value. Cell renderers are useful for rendering rich HTML values, or when processing complex data. */
    cellRenderer: any;
    /** Set to `true` to be able to type values in the display area. Default: `false`. */
    allowTyping?: boolean;
    /** If `true` it will filter the list of values as you type (only relevant when `allowTying=true`). Default: `false` */
    filterList: true;
    /** 
     * The type of search algorithm that is used when searching for values. 
     *  - `match` - Matches if the value starts with the text typed.
     *  - `matchAny` - Matches if the value contains the text typed.
     *  - `fuzzy` - Matches the closest value to text typed.
     * Default: `fuzzy` 
     */
    searchType?: 'match' | 'matchAny' | 'fuzzy';
    /** The value in `ms` for the search algorithm debounce delay (only relevant when `allowTyping=false`). Default: `300` */
    searchDebounceDelay?: number;
    /** The space in pixels between the value display and the list of items. Default: `4` */
    valueListGap?: number;
    /** The maximum height of the list of items. If the value is a `number` it will be 
     * treated as pixels, otherwise it should be a valid CSS size string. Default: `calc(var(--ag-row-height) * 6.5)`
     */
    valueListMaxHeight?: number | string;
    /** The maximum width of the list of items. If the value is a `number` it will be 
     * treated as pixels, otherwise it should be a valid CSS size string. Default: Width of the cell being edited.
     */
    valueListMaxWidth?: number | string;
     /** A callback function that allows you to change the displayed value for simple data. */
    formatValue: (value: TValue | null | undefined) => string;
}

export interface RichCellEditorParams<TData = any, TValue = any, TContext = any> extends IRichCellEditorParams<TValue>, ICellEditorParams<TData, TValue, TContext> {}