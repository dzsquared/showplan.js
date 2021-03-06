<template>
  <div class="chart-wrapper">
    <svg ref="chart" width="100%" height="600px">
      <g ref="chartG">
        <g class="connector-link" v-for="(link, index) in links" :key="'link' + index" :stroke="getStrokeColor(link)" fill="none" :stroke-width="getLineStrokeWidth(link)" stroke-linecap="round" >
          <path :d="linkPath(link)"></path>
        </g>
        <g v-for="(node, index) in nodes" :key="'node' + index" >
          <g :transform="nodeTransform(node)" @mouseover="hover(node)" @mouseout="hover(undefined)" @click="operationClicked(node)">
            <g>
              <g fill="var(--foreground)" text-anchor="middle">
                <rect class="background-rect" y="0" :x="-1 * nodeWidth / 2" :stroke="getNodeColor(node)" :width="nodeWidth" :height="nodeHeight" rx="5" ry="5" :fill="getBackgroundRectFill(node)" :fill-opacity="getBackgroundRectFillOpacity(node)" :stroke-opacity="getBackgroundRectStrokeOpacity(node)"></rect>
                <g style="font-size:.7rem">
                  <text v-if="node.data.NodeId === -1" dy="1.6em" style="font-weight:500;font-size:1.2rem">
                    {{ statement.StatementType }}
                  </text>
                  <g v-else>
                    <text dy="1.5em" >
                      {{ (node.data.NodeId === -1) ? statement.StatementType : node.data.PhysicalOp }}
                    </text>
                    <text x="75" dy="1.5em" text-anchor="right" :style="node.data.EstimateTotalCost / statement.StatementSubTreeCost < .25 ? 'fill:var(--foreground)' : 'fill:var(--red)'" v-if="node.data.NodeId !== -1">
                      {{ node.data.EstimateTotalCost / statement.StatementSubTreeCost | filterPercent }}
                    </text>
                  </g>
                </g>
                <g v-if="node.data.NodeId !== -1" style="font-size:.6rem" opacity=".5" >
                  <text v-if=" node.data.SecondaryDesc != node.data.PhysicalOp"
                    dy="3em"
                  >
                    {{ node.data.SecondaryDesc | maxLength}}
                  </text>
                  <text v-if="node.data.ThirdLevelDesc !== undefined"
                    dy="4em"
                  >
                    {{ node.data.ThirdLevelDesc | maxLength }}
                  </text>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<script lang='ts'>
import { Vue, Component, Prop, Watch, Emit } from 'vue-property-decorator';
import * as ShowPlan from '@/parser/showplan';
import { hierarchy, tree, cluster, HierarchyPointNode, HierarchyPointLink } from 'd3-hierarchy';
import { linkRadial, linkHorizontal, pointRadial, linkVertical } from 'd3-shape';
import { scalePow, scaleLog, scaleLinear } from 'd3-scale';
import { min, max } from 'd3-array';
import { Colors, GetOperationType, GetOperationColor } from '@/components/visualizations/VizColors';
import { ParentRelOp, ParentRelOpAction } from './FakeParent';
import { zoom as d3zoom } from 'd3-zoom';
import * as d3 from 'd3-selection';

@Component({
})
export default class OperatorFlow extends Vue {

  public $refs!: {
    chart: Element,
    chartG: Element,
  };

  private get queryPlan(): ShowPlan.QueryPlan {
    return this.statement!.QueryPlan!;
  }

  private get highlightedNode(): HierarchyPointNode<ShowPlan.RelOp> | undefined {
    if (this.selectedNode === undefined) {
      return undefined;
    }

    return this.root.descendants().filter((i) => i.data.NodeId === this.selectedNode!.NodeId)[0];
  }

  @Prop() public statement!: ShowPlan.StmtSimple;
  @Prop({ default: 500 }) public width!: number;
  @Prop({ default: undefined }) public selectedNode!: ShowPlan.RelOp | undefined;

  private nodeWidth: number = 180;
  private nodeHeight: number = 50;

  @Emit('rel-op-selected')
  public statementSelected(op: number) {
    //
  }

  @Emit('rel-op-highlighted')
  public statementHighlighted(op: number | undefined) {
    //
  }

  private get viewBox(): string {
    return `0 -25 ${this.width / 2} ${this.width}`;
  }

  private get radius(): number  {
    return this.width / 2;
  }

  private get root(): HierarchyPointNode<ShowPlan.RelOp> {
    const noop: ShowPlan.RelOp = new ParentRelOp();
    noop.Action.RelOp[0] = this.queryPlan.RelOp;
    noop.NodeId = -1;

    return tree<ShowPlan.RelOp>()
      .size([this.radius, this.radius])
      .nodeSize([this.nodeWidth, this.nodeHeight * 2])
      .separation((a, b) => a.parent === b.parent ? 1.1 : 1.5)
      (hierarchy(noop, (children) => children.Action.RelOp));
  }

  private getNodeColor(node: HierarchyPointNode<ShowPlan.RelOp>): string {
    return GetOperationColor(node.data.PhysicalOp);
  }

  private getLineStrokeOpacity(link: HierarchyPointLink<ShowPlan.RelOp>): number {
    const node = link.target;
    return 1;
  }

  private getLineStrokeWidth(link: HierarchyPointLink<ShowPlan.RelOp>) {
    return this.rowWidthScale(link.target.data.EstimateTotalCost);
  }

  private getStrokeColor(link: HierarchyPointLink<ShowPlan.RelOp>): string {
    const notSelectedColor = 'var(--alt-border)';

    if (this.highlightedNode === undefined) {
      return notSelectedColor;
    }

    const selectedColor = GetOperationColor(link.target.data.PhysicalOp);

    for (const childNode of this.highlightedNode.descendants()) {
      if (link.target.data.NodeId === childNode.data.NodeId) {
        return selectedColor;
      }
    }

    for (const childNode of this.highlightedNode.ancestors()) {
      if (link.target.data.NodeId === childNode.data.NodeId) {
        return selectedColor;
      }
    }

    return notSelectedColor;
  }

  private getBackgroundRectStrokeOpacity(node: HierarchyPointNode<ShowPlan.RelOp>) {
    if (this.highlightedNode === undefined) {
      return .2;
    }

    if (node.data.NodeId === this.highlightedNode.data.NodeId) {
      return 1;
    }

    for (const childNode of this.highlightedNode.descendants()) {
      if (node.data.NodeId === childNode.data.NodeId) {
        return .4;
      }
    }

    for (const childNode of this.highlightedNode.ancestors()) {
      if (node.data.NodeId === childNode.data.NodeId) {
        return 1;
      }
    }

    return .2;
  }

  private getBackgroundRectFill(node: HierarchyPointNode<ShowPlan.RelOp>) {
    if (this.highlightedNode === undefined) {
      return 'var(--background)';
    }

    if (node.data.NodeId === -1) {
      return 'var(--grey)';
    }

    if (node.data.NodeId === this.highlightedNode!.data.NodeId) {
      return GetOperationColor(node.data.PhysicalOp);
    }

    return 'var(--background)';
  }

  private getBackgroundRectFillOpacity(node: HierarchyPointNode<ShowPlan.RelOp>): number {
    if (node.data.NodeId === -1) {
      return 1;
    }

    if (this.highlightedNode === undefined) {
      return 1;
    }

    if (node.data.NodeId === this.highlightedNode!.data.NodeId) {
      return .3;
    }

    return 1;
  }

  private getNodeSize(node: HierarchyPointNode<ShowPlan.RelOp>) {
    if (node.data.NodeId === -1) {
      return 10;
    }

    return this.costCircleScale(node.data.EstimateTotalCost);
  }

  private get costCircleScale() {
    return scaleLinear()
      .domain([0, this.queryPlan.RelOp.EstimatedTotalSubtreeCost])
      .rangeRound([2, 20]);
  }

  private get rowWidthScale() {
    const minRows = min(this.nodes, (n) => n.data.EstimateRows)!;
    const maxRows = max(this.nodes, (n) => n.data.EstimateRows)!;

    return scaleLinear()
      .domain([minRows, maxRows])
      .rangeRound([1, 20]);
  }

  private get links(): Array<HierarchyPointLink<ShowPlan.RelOp>> {
    return this.root.links();
  }

  private get nodes(): Array<HierarchyPointNode<ShowPlan.RelOp>> {
    return this.root.descendants().reverse();
  }

  private nodeTransform(node: HierarchyPointNode<ShowPlan.RelOp>) {
    return `translate(${node.x}, ${node.y})`;
  }

  private linkPath(link: HierarchyPointLink<ShowPlan.RelOp>): string {
    return linkVertical()(
      {
        source: [link.source.x, link.source.y + this.nodeHeight],
        target: [link.target.x, link.target.y],
      })!;

  }

  private mounted() {
    const vm = this;
    const svg = d3.select(this.$refs.chart);

    const zoom = d3zoom()
          .scaleExtent([.5, 10])
          .wheelDelta(() => -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1) / 1000)
          .on('zoom', function() { vm.handleZoom(); });
    svg.call(zoom);
    zoom.translateBy(svg, 400, 25);
  }

  private handleZoom() {
    const svg = d3.select(this.$refs.chartG);
    svg.attr('transform', d3.event.transform);
  }

  private hover(op: HierarchyPointNode<ShowPlan.RelOp> | undefined) {
    if (op === undefined) {
      this.statementHighlighted(undefined);
      return;
    }

    if (op.data.NodeId === -1) {
      return;
    }

    this.statementHighlighted(op!.data.NodeId);
  }

  private operationClicked(op: HierarchyPointNode<ShowPlan.RelOp>) {
    if (op !== undefined && op.data.NodeId === -1) {
      return;
    }

    this.statementSelected(op.data.NodeId);
  }
}
</script>

<style lang="scss" scoped>
  .chart-wrapper .connector-link {
    transition:  stroke .3s ease;
  }

  .chart-wrapper .background-rect {
    transition: stroke-opacity .3s ease, background-color .3s ease;
  }
</style>
