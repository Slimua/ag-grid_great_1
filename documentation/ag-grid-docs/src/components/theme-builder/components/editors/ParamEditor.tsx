import type { ParamType } from '@ag-grid-community/theming';
import type { FC } from 'react';

import { ParamModel, useParamAtom } from '../../model/ParamModel';
import { useRenderedTheme } from '../../model/rendered-theme';
import { withErrorBoundary } from '../general/ErrorBoundary';
import { ColorValueEditor } from './ColorValueEditor';
import { CssValueEditor } from './CssValueEditor';
import { FontFamilyValueEditor } from './FontFamilyValueEditor';
import { FormField } from './FormField';
import { LengthValueEditor } from './LengthValueEditor';
import type { ValueEditorProps } from './ValueEditorProps';

export type ParamEditorProps = {
    param: string;
    label?: string;
    showDocs?: boolean;
};

export const ParamEditor = withErrorBoundary((props: ParamEditorProps) => {
    const param = ParamModel.for(props.param);
    const [value, setValue] = useParamAtom(param);

    const theme = useRenderedTheme();
    let editorValue = value;
    if (editorValue == null) {
        if (param.property in theme.paramCSSValues) {
            editorValue = theme.paramCSSValues[param.property];
        } else {
            throw new Error(`Param "${param.property}" does not exist.`);
        }
    }

    const ValueEditorComponent = valueEditors[param.type] || CssValueEditor;

    return (
        <FormField label={props.label || param.label} docs={props.showDocs ? param.docs : null}>
            <ValueEditorComponent param={param} value={editorValue} onChange={setValue} />
        </FormField>
    );
});

const valueEditors: Record<ParamType, FC<ValueEditorProps>> = {
    color: ColorValueEditor,
    length: LengthValueEditor,
    scale: LengthValueEditor,
    // border: BorderValueEditor,
    border: CssValueEditor,
    // borderStyle: BorderStyleValueEditor,
    borderStyle: CssValueEditor,
    shadow: CssValueEditor,
    image: CssValueEditor,
    fontFamily: FontFamilyValueEditor,
    fontWeight: CssValueEditor,
    display: CssValueEditor,
    duration: CssValueEditor,
};
