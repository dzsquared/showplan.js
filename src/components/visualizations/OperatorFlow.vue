<template>
  <div class="chart-wrapper">
    <svg ref="chart" width="100%" height="600px">
      <g transform="translate(400,25)">
      <g ref="chartG">
        <g v-for="(link, index) in links" :key="'link' + index" stroke="var(--border)" :stroke-opacity="getLineStrokeOpacity(link)" fill="none" :stroke-width="getLineStrokeWidth(link)">
          <path :d="linkPath(link)"></path>
        </g>
        <g v-for="(node, index) in nodes" :key="'node' + index" >
          <g :transform="nodeTransform(node)" @mouseover="hover(node)" @mouseout="hover(undefined)" @click="operationClicked(node)">
            <g>
              <g fill="var(--foreground)" text-anchor="middle">
                <text dy="1.6rem" style="font-size:.7rem">
                  {{ (node.data.NodeId === -1) ? statement.StatementType : node.data.PhysicalOp }}
                </text>
                <g style="font-size:.6rem" opacity=".5" >
                  <text v-if="node.data.NodeId !== -1 && node.data.SecondaryDesc != node.data.PhysicalOp"
                    dy="2.3rem"
                  >
                    {{ node.data.SecondaryDesc }}
                  </text>
                  <text v-if="node.data.NodeId !== -1 &&  node.data.ThirdLevelDesc !== undefined"
                    dy="3.1rem"
                  >
                    {{ node.data.ThirdLevelDesc }}
                  </text>
                </g>
              </g>
            </g>
            <circle :r="getNodeSize(node)" :fill="getNodeColor(node)" ></circle>
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
import { zoom } from 'd3-zoom';
import * as f from 'd3-selection';

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

  @Emit('rel-op-selected')
  public statementSelected(op: ShowPlan.RelOp) {
    //
  }

  @Emit('rel-op-highlighted')
  public statementHighlighted(op: ShowPlan.RelOp | undefined) {
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
      .nodeSize([this.radius * 1.5, 60])
      .separation((a, b) => .3)
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
    return this.rowWidthScale(link.target.data.EstimateRows);
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
      .rangeRound([2, 15]);
  }

  private get rowWidthScale() {
    const minRows = min(this.nodes, (n) => n.data.EstimateRows)!;
    const maxRows = max(this.nodes, (n) => n.data.EstimateRows)!;

    return scaleLinear()
      .domain([minRows, maxRows])
      .rangeRound([1, 10]);
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
    return linkVertical<HierarchyPointLink<ShowPlan.RelOp>, HierarchyPointNode<ShowPlan.RelOp>>()
      .x((i) => i.x)
      .y((i) => i.y)
      (link)!;
  }

  private mounted() {
    const vm = this;
    const svg = f.select(this.$refs.chart);
    svg.call(
        zoom()
          .scaleExtent([1, 10])
          .on('zoom', function() { vm.handleZoom(); }));
  }

  private handleZoom() {
    const svg = f.select(this.$refs.chartG);
    svg.attr('transform', f.event.transform);
  }

  private hover(op: HierarchyPointNode<ShowPlan.RelOp> | undefined) {
    if (op === undefined) {
      this.statementHighlighted(undefined);
      return;
    }

    if (op.data.NodeId === -1) {
      return;
    }

    this.statementHighlighted(op!.data);
  }

  private operationClicked(op: HierarchyPointNode<ShowPlan.RelOp>) {
    if (op !== undefined && op.data.NodeId === -1) {
      return;
    }

    this.statementSelected(op.data);
  }
}
</script>

<style lang="scss" scoped>

</style>