<?php
$pageTitle = "Filters Tool Panel: Enterprise Grade Feature of our Datagrid";
$pageDescription = "Enterprise feature of ag-Grid supporting Angular, React, Javascript and more. One such feature is Tool Panel. The Tool Panel allows the user to manipulate the list of columns, such as show and hide, or drag columns to group or pivot. Version 20 is available for download now, take it for a free two month trial.";
$pageKeyboards = "ag-Grid Filters Tool Panel";
$pageGroup = "feature";
include '../documentation-main/documentation_header.php';
?>

    <h1 class="heading-enterprise">Filters Tool Panel</h1>

    <p class="lead">
        The <b>Filters Tool Panel</b> allows accessing the grids filters without needing to open up the column menu.
    </p>

    <p>
        The example below shows the filters tool panel. The following can be noted:
        <ul>
            <li>
                Columns Athlete, Age, Country, Year and Date appear in the filter tool panel as they have filters.
            </li>
            <li>
                Columns Gold, Silver, Bronze and Total do not appear in the filter tool panel as they have no filters.
            </li>
            <li>
                Clicking on a column in the filter tool panel will show the filter below the column name.
                Clicking a second time will hide the filter again.
            </li>
            <li>
                Columns with filters active will have the filter icon appear beside the filter name in the tool panel.
            </li>
        </ul>
    </p>

    <?= example('Filter Tool Panel', 'simple', 'generated', array("enterprise" => 1, "processVue" => true)) ?>

    <h2>Filter Instances</h2>

    <p>
        The filters provided in the tool panel are the same instances as the filter in the column menu.
        This has the following implications:
    </p>
    <ul>
        <li>
            Configuration relating to filters equally applies when the filters appear in the tool panel.
        </li>
        <li>
            The filter behaves exactly as when it appears in the column menu. E.g. the Apply button
            will have the same meaning when used in the tool panel. Also the relationship with the Floating
            Filter (if active) will be the same.
        </li>
        <li>
            If the filter is open on the tool panel and then the user subsequently opens the column menu,
            the tool panel filter will be closed. Because the filter is the same filter instance,
            it will only appear at one location at any given time.
        </li>
    </ul>


    <h2>Expand / Collapse Filters</h2>

    <p>
        It is possible to expand and collapse the filters in the Filters Tool Panel by invoking methods
        on the Filters Tool Panel Instance. These methods are shown below:
    </p>

<snippet>
interface IFiltersToolPanel {
    expandFilters(colIds?: string[]): void;
    collapseFilters(colIds?: string[]): void;
    ... // other methods
}
</snippet>

<p>
    The code snippet below shows how to expand and collapse filters using the Filters Tool Panel instance:
</p>

    <snippet>
        // lookup Filters Tool Panel instance by id
        var filterToolPanelId = 'filters'; // default filter instance id
        var filtersToolPanel = gridOptions.api.getToolPanelInstance(filterToolPanelId);

        // expands all filters in the Filters Tool Panel
        filtersToolPanel.expandFilters();

        // collapses all filters in the Filters Tool Panel
        filtersToolPanel.collapseFilters();

        // expands the 'age' filters in the Filters Tool Panel
        filtersToolPanel.expandFilters(['age']);

        // collapses 'age' and 'sport' filters in the Filters Tool Panel
        filtersToolPanel.collapseFilters(['age', 'sport']);
    </snippet>

    <p>
        Notice in the snippet above that it's possible to target individual filters by supplying <code>colId's</code>.
    </p>

    <p>
        The example below demonstrates these methods in action. Note the following:
    </p>

    <ul class="content">
        <li>When the grid is initialised, <code>expandFilters()</code> is invoked using the
            <code>onGridReady</code> callback to expand all filters in the tool panel.</li>
        <li>Clicking <b>Collapse All</b> collapses all filters using: <code>collapseFilters()</code>.</li>
        <li>Clicking <b>Expand Age</b> just expands the 'age' filter using: <code>expandFilters(['age'])</code>.</li>
        <li>Clicking <b>Collapse Age</b> just collapses the 'age' filter using: <code>collapseFilters(['age'])</code>.</li>
        <li>Clicking <b>Expand All</b> expands all filters using: <code>expandFilters()</code>.</li>
    </ul>

    <?= example('Expand / Collapse Groups', 'expand-collapse-groups', 'generated', array("enterprise" => 1, "processVue" => true)) ?>

    <?= example('Expand / Collapse Filters', 'expand-collapse-filters', 'generated', array("enterprise" => 1, "processVue" => true)) ?>

    <h2>Custom Filters Layout</h2>

    <p style="color: red">
        TODO: Finalise Docs and Example after review
    </p>

    <?= example('Custom Filters Layout', 'custom-layout', 'generated', array("enterprise" => 1, "processVue" => true)) ?>


    <h2>Next Up</h2>

    <p>
        Now that we covered the provided Tool Panels, learn how to create
        <a href="../javascript-grid-tool-panel-component/">Custom Tool Panel Components</a>.
    </p>

<?php include '../documentation-main/documentation_footer.php';?>