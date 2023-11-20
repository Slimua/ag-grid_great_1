/**
 * These styles are injected at runtime if the example is running on the
 * website. Use them for making website-specific tweaks that we don't want to
 * show to users who view the code or run the example on CodeSandbox.
 */
export default /* css */ `

body {
    padding: 0;
}

/* This should be refactored and fixed at the place where .test-header is defined */
.test-header {
    margin-bottom: 0 !important;
}

html[data-color-scheme='dark'] body > * {
    color-scheme: dark;
}

html[data-color-scheme='dark'] div + #myGrid {
    margin-top: -8px;
}

html[data-color-scheme='dark'] button:not(#myGrid button, #myChart button, button[class*='ag-']) {
    border: 2px solid rgba(255,255,255, 0.2);
}

.ag-theme-quartz-dark {
 
}

.ag-theme-quartz {
    --ag-background-color: color-mix(in srgb, transparent, #fff 60%);
    

    .ag-row {
        background: color-mix(in srgb, transparent, #fff 60%); 
        --ag-data-color: rgba(0,0,0,0.75)
    
    }

    .ag-header {
        background: color-mix(in srgb, var(--ag-data-color), var(--ag-header-background-color) 98%); 
    }
}



html button:not(#myGrid button, #myChart button, button[class*='ag-']) {
    appearance: none;
    background-color: var(--background-100);
    border: 2px solid rgba(0,0,0, 0.2);
    border-radius: 6px;
    height: 36px;
    color: var(--default-text-color);
    cursor: pointer;
    display: inline-block;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: .01em;
    padding: 0.375em 1em 0.5em;
    white-space: nowrap;
    margin-right: 6px;
    margin-bottom: 8px;
    transition: background-color .25s ease-in-out;
}

html[data-color-scheme='dark'] button:not(#myGrid button, #myChart button, button[class*='ag-']):hover {
    background-color: #2a343e;
}

html button:not(#myGrid button, #myChart button, button[class*='ag-']):hover {
    background-color: rgba(0,0,0, 0.1);
}

html[data-color-scheme='dark'] select:not(#myGrid select, #myChart select, select[class*='ag-']) {
    appearance: none;
    background-color: #202A34;
    border: 1px solid rgb(255,255,255,0.1);
    border-radius: 4px;
    height: 36px;
    min-width: 36px;
    transition: background-color .25s ease-in-out;
}

html[data-color-scheme='dark'] select:not(#myGrid select, #myChart select, select[class*='ag-']):hover {
    background-color: #2a343e;
}

html[data-color-scheme='dark'] input:not(#myGrid input, #myChart input, [class*='ag-'], [type='checkbox'], [type='radio']) {
    appearance: none;
    background-color: #202A34;
    border: 1px solid rgb(255,255,255,0.1);
    border-radius: 4px;
    height: 36px;
    min-width: 36px;
}

html[data-color-scheme='dark'] body:not(#myGrid body, #myChart body) {
  color: #fff;
}
`;
