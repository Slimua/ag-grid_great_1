<?php

$toolPanelProperties = [
    ['toolPanels',
        'A list of all the panels to place in the side bar. The panels will be displayed in the provided order from top to bottom.'
    ],
    ['defaultToolPanel',
        'The panel (identified by id) to open by default. If none specified, the side bar is initially displayed closed.'
    ],
    ['hiddenByDefault',
        'To hide the side bar by default, set this to <code>true</code>. If left undefined the side bar will be shown.'
    ],
    ['position',
        "Sets the side bar position relative to the grid. Possible values are: <code>'left'</code> or <code>'right'</code>,
         where <code>'right'</code> is the default option."
    ]
];

$toolPanelComponentProperties = [
    ['id',
        'The unique ID for this panel. Used in the API and elsewhere to refer to the panel.'
    ],
    ['labelKey',
        'The key used for <a href="../javascript-grid-internationalisation/">internationalisation</a> for displaying the label. The label is displayed in the tab button.'
    ],
    ['labelDefault',
        'The default label if <code>labelKey</code> is missing or does not map to valid text through internationalisation.'
    ],
    ['iconKey',
        'The <a href="../javascript-grid-icons/">key of the icon</a> to be used as a graphical aid beside the label in the side bar.'
    ],
    ['toolPanel,<br/>toolPanelFramework,<br/>toolPanelParams',
        'The tool panel component to use as the panel. The provided panels use components "agColumnsToolPanel" and "agFiltersToolPanel". To provide your own custom panel component, you reference it by name here.'
    ]
];
?>
