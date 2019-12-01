<?php
$pageTitle = "ag-Grid APIs";
$pageDescription = "This page covers finer control of ag-Grid with react";
$pageKeyboards = "React Grid API";
$pageGroup = "basics";
include '../documentation-main/documentation_header.php';
?>

<div>
<h1 id="react-grid-api">More Control of ag-Grid with React</h1>

<h2 id="grid-api">Access the Grid & Column API</h2>
<p>
    When the grid is initialised, it will fire the <code>gridReady</code> event. If you want to
    use the API of the grid, you should put an <code>onGridReady(params)</code> callback onto
    the grid and grab the api from the params. You can then call this api at a later
    stage to interact with the grid (on top of the interaction that can be done by
setting and changing the props).</p>
<snippet language="jsx">
// provide gridReady callback to the grid
&lt;AgGridReact
    onGridReady={this.onGridReady}
    .../&gt;

// in onGridReady, store the api for later use
onGridReady = (params) => {
    this.api = params.api;
    this.columnApi = params.columnApi;
}

// use the api some point later!
somePointLater() {
    this.api.selectAll();
    this.columnApi.setColumnVisible('country', visible);
}</snippet>
<p>
    The <code>api</code> and <code>columnApi</code> are also stored inside the React backing object
    of the grid. So you can also look up the backing object via React and access the
    <code>api</code> and <code>columnApi</code> that way.
</p>

    <h2 id="react-row-data-control">Row Data Control</h2>
    <p>By default the ag-Grid React component will check props passed in to deteremine if data has changed and will only re-render based on actual changes.</p>

    <p>For <code>rowData</code> we provide an option for you to override this behaviour by the <code>rowDataChangeDetectionStrategy</code> property:</p>

    <snippet>

    &lt;AgGridReact
    onGridReady=<span ng-non-bindable>{</span>this.onGridReady}
        rowData=<span ng-non-bindable>{</span>this.state.rowData}
        rowDataChangeDetectionStrategy='IdentityCheck'
        ...other properties
    </snippet>

    <p>The following table illustrates the different possible combinations:</p>

    <table class="theme-table reference ng-scope">
        <tbody>
        <tr>
            <th>Strategy</th>
            <th>Behaviour</th>
            <th>Notes</th>
        </tr>
        <tr>
            <td><code>IdentityCheck</code></td>
            <td>Checks if the new prop is exactly the same as the old prop (i.e. <code>===</code>)</td>
            <td>Quick, but can result in re-renders if no actual data has changed</td>
        </tr>
        <tr>
            <td><code>DeepValueCheck</code></td>
            <td>Performs a deep value check of the old and new data</td>
            <td>Can have performance implication for larger data sets</td>
        </tr>
        <tr>
            <td><code>NoCheck</code></td>
            <td>Does no checking - passes the new value as is down to the grid</td>
            <td>Quick, but can result in re-renders if no actual data has changed</td>
        </tr>
        </tbody>
    </table>

    <p>The default value for this setting is:</p>
    <table class="theme-table reference ng-scope">
        <tbody>
        <tr>
            <th>DeltaRowDataMode</th>
            <th>Default</th>
        </tr>
        <tr>
            <td><code>true</code></td>
            <td><code>IdentityCheck</code></td>
        </tr>
        <tr>
            <td><code>false</code></td>
            <td><code>DeepValueCheck</code></td>
        </tr>
        </tbody>
    </table>

    <p>If you're using Redux or larger data sets then a default of <code>IdentityCheck</code> is a good idea <span>provided</span> you
    ensure you make a copy of thew new row data and do not mutate the <code>rowData</code> passed in.</p>


</div>

<?php include '../documentation-main/documentation_footer.php'; ?>
