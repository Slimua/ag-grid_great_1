import { createTheme } from '../../theme-types';
import { colorSchemeLightCold, colorSchemeLightNeutral } from '../color-scheme/color-schemes';
import { iconSetAlpine, iconSetMaterial, iconSetQuartzRegular } from '../icon-set/icon-sets';
import { inputStyleBordered, inputStyleUnderlined } from '../input-style/input-styles';
import { tabStyleMaterial, tabStyleQuartz, tabStyleRolodex } from '../tab-style/tab-styles';

// prettier-ignore
export const themeQuartz =
    /*#__PURE__*/
    createTheme('quartz')
        .usePart(colorSchemeLightNeutral)
        .usePart(iconSetQuartzRegular)
        .usePart(tabStyleQuartz)
        .usePart(inputStyleBordered);

// prettier-ignore
export const themeBalham =
    /*#__PURE__*/
    createTheme('balham')
        .usePart(colorSchemeLightCold)
        .usePart(iconSetAlpine)
        .usePart(tabStyleRolodex)
        .usePart(inputStyleBordered)
        .overrideParams({
            borderRadius: 2,
            wrapperBorderRadius: 2,
            headerColumnResizeHandleColor: { ref: 'borderColor' },
            headerColumnBorder: true,
            headerColumnBorderHeight: '50%',
            oddRowBackgroundColor: {
                ref: 'chromeBackgroundColor',
                mix: 0.5,
            },
            headerTextColor: {
                ref: 'foregroundColor',
                mix: 0.5,
            },
            fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
            fontSize: 12,
        })
        .addCss(
            `
            .ag-header {
                font-weight: bold;
            }
            .ag-filter-toolpanel-group-level-0-header {
                background-color: color-mix(in srgb, transparent, var(--ag-foreground-color) 7%);
                border-top: 1px solid var(--ag-border-color);
            }
        `
        );

// - [ ]
// - [ ] Hide all borders except those between rows and columns
// - [ ] Hide tab borders and show underlines
// - [ ] Roboto font

export const themeMaterial =
    /*#__PURE__*/
    createTheme('material')
        .usePart(iconSetMaterial)
        .usePart(tabStyleMaterial)
        .usePart(inputStyleUnderlined)
        .overrideParams({
            borderRadius: '0',
            wrapperBorderRadius: '0',
            wrapperBorder: false,
            sidePanelBorder: false,
            sideButtonSelectedBorder: false,
            headerColumnResizeHandleColor: 'none',
            headerBackgroundColor: {
                ref: 'backgroundColor',
            },
            rangeSelectionBackgroundColor: {
                ref: 'primaryColor',
                mix: 0.2,
            },
            rangeSelectionBorderColor: {
                ref: 'primaryColor',
            },
            fontFamily: [
                { googleFont: 'Roboto' },
                '-apple-system',
                'BlinkMacSystemFont',
                'Segoe UI',
                'Oxygen-Sans',
                'Ubuntu',
                'Cantarell',
                'Helvetica Neue',
                'sans-serif',
            ],
            inputFocusBorder: {
                style: 'solid',
                width: 2,
                color: { ref: 'primaryColor' },
            },
        })
        // TODO restore primary color, maybe through materialColorScheme
        // .addParams({
        //     primaryColor: '#3f51b5',
        // })
        .addCss(
            `
            @import "https://fonts.googleapis.com/css?family=Roboto";
            .ag-header {
                font-weight: 600;
            }
            .ag-filter-toolpanel-group-level-0-header, .ag-column-drop-horizontal {
                background-color: color-mix(in srgb, transparent, var(--ag-foreground-color) 7%);
            }
        `
        );
