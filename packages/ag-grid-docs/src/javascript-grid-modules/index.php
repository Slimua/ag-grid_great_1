<?php
$pageTitle = "ag-Grid Reference: ag-Grid Modules";
$pageDescription = "ag-Grid is a feature-rich datagrid available in Free or Enterprise versions. This page explains how to set the License Key in ag-Grid Enterprise";
$pageKeyboards = "ag-Grid JavaScript Data Grid Modules";
$pageGroup = "feature";
include '../documentation-main/documentation_header.php';
?>

<style>
    .feature-group-title {
        display: block;
        margin-top: 26px;
        font-size: 30px;
    }

    .feature-title {
        display: block;
    }

    .feature-title-indent-1 {
        padding-left: 40px;
    }

    .feature-title-indent-2 {
        padding-left: 80px;
    }

    .feature-title-indent-3 {
        padding-left: 120px;
    }

    .feature-title-indent-4 {
        padding-left: 160px;
    }
</style>
<?php
function printFeatures($enterprise, $framework)
{
    $lev1Items = json_decode(file_get_contents('../documentation-main/modules.json'), true);
    foreach ($lev1Items as $lev1Item) {
        if ($enterprise) {
            if ($lev1Item['enterprise']) {
                printFeature($lev1Item, 0);
            }
        } else if ($framework) {
            if ($lev1Item['framework']) {
                printFeature($lev1Item, 0);
            }
        } else if (!$lev1Item['enterprise'] && !$lev1Item['framework']) {
            printFeature($lev1Item, 0);
        }
    }
}

function printFeature($item)
{
    $itemTitle = $item['title'];
    $module = $item['module'];
    $exported = $item['exported'];

    echo "<tr>";
    echo "<td style='white-space: nowrap'>$itemTitle ";
    if ($item['enterprise']) {
        echo "<img src=\"../_assets/svg/enterprise.svg\" style=\"width: 16px;\"/>";
    }
    echo "</span></td>";
    echo "<td style='white-space: nowrap'>$module</td>";
    echo "<td>$exported</td>";
    echo "</tr>";
}

?>

<h1>ag-Grid Modules</h1>

<p class="lead">
    Version 22.0.0 changes the way ag-Grid is made available by providing functionality in modules, allowing you to
    pick and choose which features you require, resulting in a smaller application size overall.
</p>

<h2>Introduction</h2>

<p>
    In previous releases all Community functionality was provided in a single dependency (<code>ag-grid-community</code>)
    and all Enterprise functionality in another dependency (<code>ag-grid-enterprise</code>).
</p>

<p>
    Since version 22.0.0, ag-Grid can be consumed by just including the feature modules required, which should result in
    smaller overall application sizes.
</p>

<note>
    The introduction of modules in version 22.0.0 is a significant first step towards reducing the size of ag-Grid
    inside applications. As most of the new modules
    cover enterprise features, community users should not expect to see a size reduction right away. However, in the
    coming releases, we will strive to reduce
    the size of the community-core module by splitting it out into separate community modules.
</note>

<h2>Modules</h2>

<p>
    The below table summarizes the modules provided in the ag-Grid Community and ag-Grid Enterprise packages.
</p>

<table class="properties">
    <tr>
        <th></th>
        <th>Community Module</th>
        <th>Exported</th>
    </tr>
    <?php printFeatures(false, false) ?>

    <!--    <tr>-->
    <!--        <th></th>-->
    <!--        <th>Framework Module</th>-->
    <!--        <th>Exported</th>-->
    <!--    </tr>-->
    <!--    --><?php //printFeatures(false, true) ?>

    <tr>
        <th></th>
        <th>Enterprise Module <img src="../_assets/svg/enterprise.svg" style="width: 16px;"/></th>
        <th>Exported</th>
    </tr>
    <?php printFeatures(true, false) ?>
</table>

<h2><code>@ag-grid-community/all-modules</code></h2>

<p><code>@ag-grid-community/all-modules</code> can be considered to be equivalent to <code>ag-grid-community</code>, but
    with the additional
    need to register modules within. If using this module you might be better off using <code>ag-grid-community</code>
    as the bundle size
    will be similar and will reduce the need to register modules.</p>

<img class="img-fluid" style="display:block; margin-left: auto; margin-right: auto" src="./community-all-modules.png"
     alt="@ag-grid-community/all-modules">

<h2><code>@ag-grid-enterprise/all-modules</code></h2>

<p><code>@ag-grid-enterprise/all-modules</code> can be considered to be equivalent to <code>ag-grid-enterprise</code>,
    but with the additional
    need to register modules within. If using this module you might be better off using <code>ag-grid-enterprise</code>
    (along with <code>ag-grid-enterprise)</code> as the bundle size will be similar and will reduce the need to register
    modules.</p>

<img class="img-fluid" style="display:block; margin-left: auto; margin-right: auto" src="./enterprise-all-modules.png"
     alt="@ag-grid-enterprise/all-modules">


<note>If you decide to use <code style="white-space: nowrap">@ag-grid-enterprise/all-modules</code> then you do <strong>not</strong>
    need to
    specify <code style="white-space: nowrap">@ag-grid-community/all-modules</code> too. <code
            style="white-space: nowrap">@ag-grid-enterprise/all-modules</code>
    will contain all Community modules.
</note>

<h2><code>@ag-grid-community/core</code></h2>

<p>This module contains the core code required by the Grid and all modules (Enterprise or Community) depend on it.
    As such <code>@ag-grid-community/core</code> will always be available no matter what module you specify in your <code>package.json</code>.</p>

<img class="img-fluid" style="display:block; margin-left: auto; margin-right: auto" src="./community-hierarchy.png"
     alt="Community Hierarchy">

<p>For example, let's assume you specify the following in your <code>package.json</code>:</p>

<snippet>
"dependencies": {
    "@ag-grid-community/client-side-row-model": "22.0.0"
}
</snippet>

<p>You can then use <code>@ag-grid-community/core</code> as this will be implicitly available to you:</p>

<snippet>
import {Grid, GridOptions} from '@ag-grid-community/core';
import {ClientSideRowModelModule} from "@ag-grid-community/client-side-row-model";

... the rest of your code
</snippet>

<h2><code>@ag-grid-enterprise/core</code></h2>

<p>All Enterprise modules depend on <code>@ag-grid-enterprise/core</code> as such will always be available no matter what
    Enterprise module you specify in your <code>package.json</code>.</p>

<p>The main functionality you'll want to import from the <code>@ag-grid-enterprise/core</code> is the <code>LicenceManager</code>.</p>

<img class="img-fluid" style="display:block; margin-left: auto; margin-right: auto" src="./enterprise-hierarchy.png"
     alt="Enterprise Hierarchy">

<p><span style="font-style: italic">The above is a truncated hierarchy of Entreprise modules for illustrative purposes.</span></p>

<p>For example, let's assume you specify the following in your <code>package.json</code>:</p>

<snippet>
"dependencies": {
    "@ag-grid-enterprise/filter-tool-panel": "22.0.0"
}
</snippet>

<p>You can then use <code>@ag-grid-enterprise/core</code> as this will be implicitly available to you:</p>

<snippet>
    import {Grid, GridOptions} from '@ag-grid-community/core';
    import {LicenseManager} from '@ag-grid-enterprise/core';
    import {FiltersToolPanelModule} from "@ag-grid-enterprise/filter-tool-panel";

    LicenseManager.setLicenseKey(...your key...);

    ... the rest of your code
</snippet>
<h2>Framework Modules</h2>

<table class="properties">
    <tr>
        <th></th>
        <th>Framework Module</th>
        <th>Exported</th>
    </tr>
    <?php printFeatures(false, true) ?>
</table>

<note><sup>(!)</sup> The framework modules are <strong>not</strong> included in either <code>@ag-grid-community/all-modules</code>
    or <code style="white-space: nowrap">@ag-grid-enterprise/all-modules</code>. You need to explicitly import the framework module that
    corresponds to your chosen framework, if using a framework.<br/><br/> Framework modules are standalone packages and do
    <strong>not</strong> need to be supplied to the Grid.
</note>


<h2>Installing ag-Grid Modules</h2>

<p>If you wish to pull in all Community or all Enterprise modules as you did before you can specify the corresponding
    packages (<code>@ag-grid-community/all-modules</code> and <code>@ag-grid-enterprise/all-modules</code>) and
    reference them later.</p>

<p>There are two ways to supply modules to the grid - either globally or by individual grid:</p>

<h3>Providing Modules Globally</h3>

<p>You can import and provide all modules to the Grid globally if you so desire, but you need to ensure that this is
    done
    before <span style="font-style: italic"><strong>any</strong></span> Grids are instantiated.</p>

<p>First, import the modules you require:</p>
<snippet>
    import {ModuleRegistry, AllCommunityModules} from '@ag-grid-community/all-modules';

    // or if using ag-Grid Enterprise
    import {ModuleRegistry, AllModules} from '@ag-grid-enterprise/all-modules';

    // or if choosing individual modules
    import {ClientSideRowModelModule} from "@ag-grid-community/client-side-row-model";
</snippet>

<p>Then provide these modules to the Grid:</p>

<snippet>
    ModuleRegistry.registerModules(AllCommunityModules);

    // or if using ag-Grid Enterprise
    ModuleRegistry.registerModules(AllModules);

    // or if choosing individual modules
    ModuleRegistry.register(ClientSideRowModelModule);
</snippet>

<h3>Providing Modules To Individual Grids</h3>

<p>If you choose to select modules based on requirements then at a minimum the a
    <a href="../javascript-grid-row-models/">Row Model</a> need to be specified. After that all other modules are
    optional
    depending on your requirements.</p>

<p>Regardless of your choice you'll need to do the following:</p>

<ol>
    <li>Specify the Grid Modules you wish to import:</li>

    <snippet>
        // pull in all community modules
        "dependencies": {
            "@ag-grid-community/all-modules": "22.0.0"
        }

        // or just specify the minimum you need - in this case we're choosing the Client Side Row Model

        "dependencies": {
            "@ag-grid-community/client-side-row-model": "22.0.0"
        }
    </snippet>

    <p>Note that if you specify an Enterprise module you do not need to specify Community module(s) unless you require
        them.
        For example if you use the <code>ServerSideRowModelModule</code> then you only need to specify
        <span style="white-space: nowrap"><code>@ag-grid-enterprise/server-side-row-model</code></span>
        as a dependency.</p>

    <li>Import the module(s) you need</li>
    <snippet>
        import {AllCommunityModules} from '@ag-grid-community/all-modules';

        // or if using ag-Grid Enterprise
        import {AllModules} from '@ag-grid-enterprise/all-modules';

        // or if choosing individual modules
        import {ClientSideRowModelModule} from "@ag-grid-community/client-side-row-model";
    </snippet>

    <li>Provide the module(s) to the Grid</li>
    <snippet>
// Javascript
new Grid(&lt;dom element&gt;, gridOptions, { modules: AllModules});
// or if choosing individual modules
new Grid(&lt;dom element&gt;, gridOptions, { modules: [ClientSideRowModelModule]});

// Angular
public modules: Module[] = AllModules;
// or if choosing individual modules
public modules: Module[] = [ClientSideRowModelModule];

&lt;ag-grid-angular&gt;
    [rowData]="rowData"
    [columnDefs]="columnDefs"
    [modules]="modules"
&lt;/ag-grid-angular&gt;

// React
&lt;ag-grid-react&gt;
    rowData={rowData}
    columnDefs={columnDefs}
    modules={AllModules}
&lt;/ag-grid-react&gt;
// or if choosing individual modules
&lt;ag-grid-react&gt;
    rowData={rowData}
    columnDefs={columnDefs}
    modules={[ClientSideRowModelModule]}
&lt;/ag-grid-react&gt;

// Vue
data() {
    return {
        columnDefs: ...column defs...,
        rowData: ....row data...,
        modules: AllModules
    }
}
&lt;ag-grid-vue
    :columnDefs="columnDefs"
    :rowData="rowData"
    :modules="modules"&gt;
&lt;/ag-grid-vue&gt;

// or if choosing individual modules
data() {
    return {
        columnDefs: ...column defs...,
        rowData: ....row data...,
        modules: [ClientSideRowModelModule]
    }
}
&lt;ag-grid-vue
    :columnDefs="columnDefs"
    :rowData="rowData"
    :modules="modules"&gt;
&lt;/ag-grid-vue&gt;
    </snippet>
</ol>

<h2 id="migrating-to-modules">Migrating</h2>
<p>This section documents how to migrate from the <code>ag-grid-community</code> and <code>ag-grid-enterprise</code>
    packages
    to the new modular based one.</p>

<p>In versions 21.x and before you would have needed to referenced the <code>ag-grid-community</code> and <code>ag-grid-enterprise</code>
    packages in <code>package.json</code>:</p>
<snippet>
"dependencies": {
    "ag-grid-community": "21.0.0",
    "ag-grid-enterprise": "21.0.0"
}
</snippet>

<p>And then import the <code>ag-grid-enterprise</code> package if using Enterprise features:</p>

<snippet>import "ag-grid-enterprise";</snippet>

<p>For Version 22.x onwards you need to update your <code>package.json</code> to reference the new module base package,
    depending on the feature set you require (note you no longer need to specify both Community and Enterprise - just
    the one will do):</p>
<snippet>
"dependencies": {
    "@ag-grid-community/all-modules": "22.0.0"
}

// or, if using Enterprise features
"dependencies": {
    "@ag-grid-enterprise/all-modules": "22.0.0"
}
</snippet>

<p>You then need to import the modules exported by each package:</p>

<snippet>
    import {AllCommunityModules} from "@ag-grid-community/all-modules";

    // or, if using Enterprise features
    import {AllModules} from "@ag-grid-enterprise/all-modules";
</snippet>

<p>You'll now need to supply the modules used to the Grid:</p>

<snippet>
// Javascript
new Grid(&lt;dom element&gt;, gridOptions, { modules: AllCommunityModules});

// Angular
public modules: Module[] = AllCommunityModules;

&lt;ag-grid-angular&gt;
    [rowData]="rowData"
    [columnDefs]="columnDefs"
    [modules]="modules"
&lt;/ag-grid-angular&gt;

// React
&lt;ag-grid-react&gt;
    rowData={rowData}
    columnDefs={columnDefs}
    modules={AllCommunityModules}
&lt;/ag-grid-react&gt;

// Vue
data() {
    return {
        columnDefs: ...column defs...,
        rowData: ....row data...,
        modules: AllCommunityModules
    }
}
&lt;ag-grid-vue
    :columnDefs="columnDefs"
    :rowData="rowData"
    :modules="modules"&gt;
&lt;/ag-grid-vue&gt;

// --------------------------------
// or, if using Enterprise features
// --------------------------------

// Javascript
new Grid(&lt;dom element&gt;, gridOptions, { modules: AllModules});

// Angular
public modules: Module[] = AllModules;

&lt;ag-grid-angular&gt;
    [rowData]="rowData"
    [columnDefs]="columnDefs"
    [modules]="modules"
&lt;/ag-grid-angular&gt;

// React
&lt;ag-grid-react&gt;
    rowData={rowData}
    columnDefs={columnDefs}
    modules={AllModules}
&lt;/ag-grid-react&gt;

// Vue
data() {
    return {
        columnDefs: ...column defs...,
        rowData: ....row data...,
        modules: AllModules
    }
}
&lt;ag-grid-vue
    :columnDefs="columnDefs"
    :rowData="rowData"
    :modules="modules"&gt;
&lt;/ag-grid-vue&gt;
</snippet>

<p>Finally, you'll need to update the paths of CSS or SCSS that you reference:</p>

<snippet>
    // CSS Community
    import "./node_modules/@ag-grid-community/all-modules/dist/styles/ag-grid.css";
    import "./node_modules/@ag-grid-community/all-modules/dist/styles/ag-theme-balham.css";

    // or, if using Enterprise features
    import "./node_modules/@ag-grid-enterprise/all-modules/dist/styles/ag-grid.css";
    import "./node_modules/@ag-grid-enterprise/all-modules/dist/styles/ag-theme-balham.css";

    // SCSS Community
    @import "./node_modules/@ag-grid-community/all-modules/dist/styles/ag-grid.scss";
    @import "./node_modules/@ag-grid-community/all-modules/dist/styles/ag-theme-balham/sass/ag-theme-balham.scss";

    // or, if using Enterprise features
    @import "./node_modules/@ag-grid-enterprise/all-modules/dist/styles/ag-grid.scss";
    @import "./node_modules/@ag-grid-enterprise/all-modules/dist/styles/ag-theme-balham/sass/ag-theme-balham.scss";
</snippet>
<?php include '../documentation-main/documentation_footer.php'; ?>
