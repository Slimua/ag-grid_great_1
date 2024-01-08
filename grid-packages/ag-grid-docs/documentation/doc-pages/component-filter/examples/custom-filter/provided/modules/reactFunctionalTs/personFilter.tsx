import React, { useCallback } from 'react';
import { IDoesFilterPassParams } from "@ag-grid-community/core";
import { CustomFilterProps, useGridFilter } from '@ag-grid-community/react';

export default ({ model, onModelChange, getValue }: CustomFilterProps) => {
    const doesFilterPass = useCallback((params: IDoesFilterPassParams) => {
        const { node } = params;
        const filterText: string = model;
        const value: string = getValue(node).toString().toLowerCase();
        // make sure each word passes separately, ie search for firstname, lastname
        return filterText.toLowerCase().split(' ')
            .every(filterWord => value.indexOf(filterWord) >= 0);
    }, [model]);

    // register filter handlers with the grid
    useGridFilter({
        doesFilterPass,
    });

    return (
        <div className='person-filter'>
            <div>Custom Athlete Filter</div>
            <div>
                <input
                    type="text"
                    value={model || ''}
                    onChange={({ target: { value }}) => onModelChange(value === '' ? null : value)}
                    placeholder="Full name search..."
                />
            </div>
            <div>This filter does partial word search on multiple words, eg "mich phel" still brings back Michael Phelps.</div>
        </div>
    )
};
