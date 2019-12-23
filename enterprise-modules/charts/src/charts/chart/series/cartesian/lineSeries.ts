import { Path } from "../../../scene/shape/path";
import ContinuousScale from "../../../scale/continuousScale";
import { Selection } from "../../../scene/selection";
import { Group } from "../../../scene/group";
import palette from "../../palettes";
import { SeriesNodeDatum, CartesianTooltipRendererParams as LineTooltipRendererParams } from "../series";
import { numericExtent } from "../../../util/array";
import { toFixed } from "../../../util/number";
import { PointerEvents } from "../../../scene/node";
import { LegendDatum } from "../../legend";
import { Shape } from "../../../scene/shape/shape";
import { Marker } from "../../marker/marker";
import { CartesianSeries, CartesianSeriesMarker, CartesianSeriesMarkerFormat } from "./cartesianSeries";
import { ChartAxisDirection } from "../../chartAxis";

interface GroupSelectionDatum extends SeriesNodeDatum {
    x: number;
    y: number;
}

export { LineTooltipRendererParams };

export class LineSeries extends CartesianSeries {

    static className = 'LineSeries';

    private xDomain: any[] = [];
    private yDomain: any[] = [];
    private xData: any[] = [];
    private yData: any[] = [];

    private lineNode = new Path();

    // We use groups for this selection even though each group only contains a marker ATM
    // because in the future we might want to add label support as well.
    private groupSelection: Selection<Group, Group, GroupSelectionDatum, any> = Selection.select(this.group).selectAll<Group>();

    readonly marker = new CartesianSeriesMarker();

    constructor() {
        super();

        const lineNode = this.lineNode;
        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.pointerEvents = PointerEvents.None;
        this.group.append(lineNode);

        const { marker } = this;
        marker.addPropertyListener('type', () => this.onMarkerTypeChange());
        marker.addPropertyListener('enabled', event => {
            if (!event.value) {
                this.groupSelection = this.groupSelection.setData([]);
                this.groupSelection.exit.remove();
            }
        });
        marker.addEventListener('change', () => this.update());
    }

    onMarkerTypeChange() {
        this.groupSelection = this.groupSelection.setData([]);
        this.groupSelection.exit.remove();
        this.update();

        this.fireEvent({type: 'legendChange'});
    }

    protected _title?: string;
    set title(value: string | undefined) {
        if (this._title !== value) {
            this._title = value;
            this.scheduleLayout();
        }
    }
    get title(): string | undefined {
        return this._title;
    }

    protected _xKey: string = '';
    set xKey(value: string) {
        if (this._xKey !== value) {
            this._xKey = value;
            this.xData = [];
            this.scheduleData();
        }
    }
    get xKey(): string {
        return this._xKey;
    }

    protected _xName: string = '';
    set xName(value: string) {
        if (this._xName !== value) {
            this._xName = value;
            this.update();
        }
    }
    get xName(): string {
        return this._xName;
    }

    protected _yKey: string = '';
    set yKey(value: string) {
        if (this._yKey !== value) {
            this._yKey = value;
            this.yData = [];
            this.scheduleData();
        }
    }
    get yKey(): string {
        return this._yKey;
    }

    protected _yName: string = '';
    set yName(value: string) {
        if (this._yName !== value) {
            this._yName = value;
            this.update();
        }
    }
    get yName(): string {
        return this._yName;
    }

    processData(): boolean {
        const { xAxis, xKey, yKey, xData, yData } = this;
        const data = xKey && yKey ? this.data : [];

        if (!xAxis) {
            return false;
        }

        const isContinuousX = xAxis.scale instanceof ContinuousScale;

        xData.length = 0;
        yData.length = 0;

        for (let i = 0, n = data.length; i < n; i++) {
            const datum = data[i];
            const x = datum[xKey];
            const y = datum[yKey];

            if (x == null || (isContinuousX && isNaN(x)) || y == null || isNaN(y)) {
                continue;
            }

            xData.push(x);
            yData.push(y);
        }

        this.xDomain = isContinuousX ? this.fixNumericExtent(numericExtent(xData), 'x') : xData;
        this.yDomain = this.fixNumericExtent(numericExtent(yData), 'y');

        return true;
    }

    getDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.xDomain;
        } else {
            return this.yDomain;
        }
    }

    private _fill: string = palette.fills[0];
    set fill(value: string) {
        if (this._fill !== value) {
            this._fill = value;
            this.scheduleData();
        }
    }
    get fill(): string {
        return this._fill;
    }

    private _stroke: string = palette.strokes[0];
    set stroke(value: string) {
        if (this._stroke !== value) {
            this._stroke = value;
            this.scheduleData();
        }
    }
    get stroke(): string {
        return this._stroke;
    }

    private _strokeWidth: number = 2;
    set strokeWidth(value: number) {
        if (this._strokeWidth !== value) {
            this._strokeWidth = value;
            this.update();
        }
    }
    get strokeWidth(): number {
        return this._strokeWidth;
    }

    private _fillOpacity: number = 1;
    set fillOpacity(value: number) {
        if (this._fillOpacity !== value) {
            this._fillOpacity = value;
            this.scheduleLayout();
        }
    }
    get fillOpacity(): number {
        return this._fillOpacity;
    }

    private _strokeOpacity: number = 1;
    set strokeOpacity(value: number) {
        if (this._strokeOpacity !== value) {
            this._strokeOpacity = value;
            this.scheduleLayout();
        }
    }
    get strokeOpacity(): number {
        return this._strokeOpacity;
    }

    highlightStyle: {
        fill?: string,
        stroke?: string
    } = { fill: 'yellow' };

    private highlightedNode?: Marker;

    highlightNode(node: Shape) {
        if (!(node instanceof Marker)) {
            return;
        }

        this.highlightedNode = node;
        this.scheduleLayout();
    }

    dehighlightNode() {
        this.highlightedNode = undefined;
        this.scheduleLayout();
    }

    update(): void {
        const { chart, xAxis, yAxis } = this;

        this.group.visible = this.visible;

        if (!xAxis || !yAxis || !chart || chart.layoutPending || chart.dataPending) {
            return;
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth || 0) / 2;
        const yOffset = (yScale.bandwidth || 0) / 2;

        const {
            data,
            xData,
            yData,
            marker,
            lineNode
        } = this;

        const groupSelectionData: GroupSelectionDatum[] = [];
        const linePath = lineNode.path;

        linePath.clear();
        xData.forEach((xDatum, i) => {
            const yDatum = yData[i];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            if (i > 0) {
                linePath.lineTo(x, y);
            } else {
                linePath.moveTo(x, y);
            }

            if (marker) {
                groupSelectionData.push({
                    seriesDatum: data[i],
                    x,
                    y
                });
            }
        });

        lineNode.stroke = this.stroke;
        lineNode.strokeWidth = this.strokeWidth;

        this.updateGroupSelection(groupSelectionData);
    }

    private updateGroupSelection(groupSelectionData: GroupSelectionDatum[]) {
        const { marker, xKey, yKey, highlightedNode, fill, stroke, strokeWidth } = this;
        let { groupSelection } = this;

        const Marker = marker.type;

        const updateGroups = groupSelection.setData(groupSelectionData);
        updateGroups.exit.remove();

        const enterGroups = updateGroups.enter.append(Group);
        enterGroups.append(Marker);

        const { fill: highlightFill, stroke: highlightStroke } = this.highlightStyle;
        const markerFormatter = marker.formatter;
        const markerSize = marker.size;
        const markerStrokeWidth = marker.strokeWidth !== undefined ? marker.strokeWidth : strokeWidth;

        groupSelection = updateGroups.merge(enterGroups);
        groupSelection.selectByClass(Marker)
            .each((node, datum) => {
                const isHighlightedNode = node === highlightedNode;
                const markerFill = isHighlightedNode && highlightFill !== undefined ? highlightFill : marker.fill || fill;
                const markerStroke = isHighlightedNode && highlightStroke !== undefined ? highlightStroke : marker.stroke || stroke;
                let markerFormat: CartesianSeriesMarkerFormat | undefined = undefined;

                if (markerFormatter) {
                    markerFormat = markerFormatter({
                        datum: datum.seriesDatum,
                        xKey,
                        yKey,
                        fill: markerFill,
                        stroke: markerStroke,
                        strokeWidth: markerStrokeWidth,
                        size: markerSize,
                        highlighted: isHighlightedNode
                    });
                }

                node.fill = markerFormat && markerFormat.fill || markerFill;
                node.stroke = markerFormat && markerFormat.stroke || markerStroke;
                node.strokeWidth = markerFormat && markerFormat.strokeWidth !== undefined
                    ? markerFormat.strokeWidth
                    : markerStrokeWidth;
                node.size = markerFormat && markerFormat.size !== undefined
                    ? markerFormat.size
                    : markerSize;

                node.translationX = datum.x;
                node.translationY = datum.y;
                node.visible = marker.enabled && node.size > 0;
            });

        this.groupSelection = groupSelection;
    }

    getTooltipHtml(nodeDatum: GroupSelectionDatum): string {
        const { xKey, yKey } = this;

        if (!xKey || !yKey) {
            return '';
        }

        const { xName, yName, fill: color, title, tooltipRenderer } = this;

        if (tooltipRenderer) {
            return tooltipRenderer({
                datum: nodeDatum.seriesDatum,
                xKey,
                xName,
                yKey,
                yName,
                title,
                color,
            });
        } else {
            const titleStyle = `style="color: white; background-color: ${color}"`;
            const titleString = title ? `<div class="title" ${titleStyle}>${title}</div>` : '';
            const seriesDatum = nodeDatum.seriesDatum;
            const xValue = seriesDatum[xKey];
            const yValue = seriesDatum[yKey];
            const xString = typeof xValue === 'number' ? toFixed(xValue) : String(xValue);
            const yString = typeof yValue === 'number' ? toFixed(yValue) : String(yValue);

            return `${titleString}<div class="content">${xString}: ${yString}</div>`;
        }
    }

    tooltipRenderer?: (params: LineTooltipRendererParams) => string;

    listSeriesItems(data: LegendDatum[]): void {
        const { id, xKey, yKey, yName, title, visible, marker, fill, stroke, fillOpacity, strokeOpacity } = this;

        if (this.data.length && xKey && yKey) {
            data.push({
                id: id,
                itemId: undefined,
                enabled: visible,
                label: {
                    text: title || yName || yKey
                },
                marker: {
                    type: marker.type,
                    fill: marker.fill || fill,
                    stroke: marker.stroke || stroke,
                    fillOpacity,
                    strokeOpacity
                }
            });
        }
    }
}
