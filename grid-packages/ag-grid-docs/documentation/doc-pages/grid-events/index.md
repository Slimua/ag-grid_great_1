---
title: "Grid Events"
---

This is a list of all the events that the grid raises.

<framework-specific-section frameworks="javascript">
|You register callbacks for these events through the `GridOptions` interface.
|The name of the callback is constructed by prefixing the event name with `on`. For example, the callback for the `cellClicked` event is `gridOptions.onCellClicked`.
</framework-specific-section>

<framework-specific-section frameworks="javascript">
<snippet transform={false}>
| const gridOptions = {
|     // Add event handlers
|     onCellClicked: (event: CellClickedEvent) => console.log('Cell was clicked'),
| }
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="javascript">
<note>
| TypeScript users can take advantage of the events' interfaces. You can construct the interface name by suffixing the event name with `Event`. For example, the `cellClicked` event uses the interface `CellClickedEvent`. All events support generics. See [Typescript Generics](../typescript-generics) for more details.
</note>
</framework-specific-section>


<framework-specific-section frameworks="angular">
| Provide your event handler to the relevant `Output` property on the `ag-grid-angular` component. Note that the 'on' prefix is not part of the output name.
</framework-specific-section>

<framework-specific-section frameworks="angular">
<snippet transform={false} language="html">
| &lt;ag-grid-angular (cellClicked)="onCellClicked($event)">
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="vue">
| Provide your event handler to the relevant event callback on the `ag-grid-vue` component.
</framework-specific-section>

<framework-specific-section frameworks="vue">
<snippet transform={false} language="jsx">
| onCellClicked = (params) => console.log('Cell was clicked');
|
| &lt;ag-grid-vue @cell-clicked="onCellClicked"> &lt;/ag-grid-vue> 
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="javascript">
|
|## Registering via Grid Options
|
|Registering the event onto the grid component as shown above is the recommended way. However additionally a callback can be put on the [Grid Options](/grid-interface/), if you are using a Grid Options object.
|The name of the callback is constructed by prefixing the event name with `on`. For example, the callback for the `cellClicked` event is `gridOptions.onCellClicked`.
|
</framework-specific-section>

<framework-specific-section frameworks="javascript">
<snippet transform={false}>
| const gridOptions = {
|     // Add event handlers
|     onCellClicked: (event: CellClickedEvent) => console.log('Cell was clicked'),
| }
</snippet>
</framework-specific-section>

Grid events are asynchronous so that the state of the grid will be settled by the time your event callback gets invoked.

## List of Events

The following are all events emitted by the grid. If using TypeScript, you can reference the interface for each event.

<api-documentation source='events.json' ></api-documentation>
