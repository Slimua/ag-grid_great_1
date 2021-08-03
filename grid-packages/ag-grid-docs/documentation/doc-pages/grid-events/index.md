---
title: "Grid Events"
---

This is a list of the events that the grid raises. You can register callbacks for these events through the `GridOptions` interface.

The name of the callback is constructed by prefixing the event name with `on`. For example, the callback for the `cellClicked` event is `gridOptions.onCellClicked`.

```ts
 const gridOptions = {
     // Add event handlers
     onCellClicked: (event: CellClickedEvent) => console.log('Cell was clicked'),
 }
```

[[only-angular]]
| Alternatively provide your event handler to the relevant `Output` property on the `ag-grid-angular` component. Note that the 'on' prefix is not part of the output name. 
|
| ```html
| <ag-grid-angular (cellClicked)="onCellClicked($event)">
| ```

[[only-react]]
| Alternatively provide your event handler to the relevant React Prop on the `AgGridReact` component.
|
| ```tsx
| const onCellClicked = (params: CellClickedEvent) => console.log('Cell was clicked');
|
| <AgGridReact onCellClicked={onCellClicked}> </AgGridReact>
| ```

[[only-vue]]
| Alternatively provide your event handler to the relevant event callback on the `ag-grid-vue` component.
|
| ```jsx
| onCellClicked = (params) => console.log('Cell was clicked');
|
| <ag-grid-vue @cell-clicked="onCellClicked"> </ag-grid-vue> 
| ```

[[note]]
| TypeScript users can take advantage of the events' interfaces. You can construct the interface name by suffixing the event name with `Event`. For example, the `cellClicked` event uses the interface `CellClickedEvent`.

<api-documentation source='events.json'></api-documentation>