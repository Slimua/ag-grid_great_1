import { ref, transparentRef } from '../..';
import { definePart } from '../../theme-utils';
import { colorSchemeLightNeutral } from '../color-scheme/color-schemes';
import { iconSetQuartzRegular } from '../icon-set/icon-sets';

export const designQuartz = definePart({
  partId: 'design',
  variantId: 'quartz',
  overrideParams: {},
  dependencies: [colorSchemeLightNeutral, iconSetQuartzRegular],
});

export const designBalham = definePart({
  partId: 'design',
  variantId: 'balham',
  overrideParams: {
    borderRadius: '2px',
    wrapperBorderRadius: '2px',
    headerColumnResizeHandleDisplay: 'none',
    columnHeaderBorder: true,
    columnHeaderBorderHeight: '50%',
    oddRowBackgroundColor: transparentRef('chromeBackgroundColor', 0.5),
    headerTextColor: transparentRef('foregroundColor', 0.5),
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    fontSize: '12px',
  },
  css: [
    `
    .ag-header {
        font-weight: bold;
    }
    .ag-filter-toolpanel-group-level-0-header {
        background-color: color-mix(in srgb, transparent, var(--ag-foreground-color) 7%);
        border-top: 1px solid var(--ag-border-color);
    }
  `,
  ],
});

// - [ ]
// - [ ] Hide all borders except those between rows and columns
// - [ ] Hide tab borders and show underlines
// - [ ] Roboto font

export const designMaterial = definePart({
  partId: 'design',
  variantId: 'material',
  overrideParams: {
    borderRadius: '0',
    wrapperBorderRadius: '0',
    wrapperBorder: false,
    sidePanelBorder: false,
    sideButtonSelectedBorder: false,
    headerColumnResizeHandleDisplay: 'none',
    headerBackgroundColor: ref('backgroundColor'),
    fontFamily:
      'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  },
  css: [
    `
    @import "https://fonts.googleapis.com/css?family=Roboto";
    .ag-header {
        font-weight: 600;
    }
    .ag-filter-toolpanel-group-level-0-header, .ag-column-drop-horizontal {
        background-color: color-mix(in srgb, transparent, var(--ag-foreground-color) 7%);
    }
  `,
  ],
});

export const allDesigns = [designQuartz, designBalham, designMaterial];
