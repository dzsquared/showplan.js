<template>
  <div>
      <div v-if="adaptiveJoin.adaptiveJoinKeysBuild !== undefined && adaptiveJoin.adaptiveJoinKeysBuild.length > 0" class="content">
        <h4>Hash Keys Build</h4>
        <ul class="small">
          <li v-for="(column, index) in adaptiveJoin.adaptiveJoinKeysBuild" :key="index"><sql-string :sql="column.toString()" :expandedColumns="expandedChildColumns"></sql-string></li>
        </ul>
      </div>
      <div v-if="adaptiveJoin.BuildResidual !== undefined" class="content">
        <h4>Build Residual</h4>
        <div class="small"><sql-string :sql="adaptiveJoin.BuildResidual.ScalarOperator.ScalarString" :expandedColumns="expandedChildColumns"></sql-string></div>
      </div>
      <div class="content" v-if="adaptiveJoin.adaptiveJoinKeysProbe !== undefined && adaptiveJoin.adaptiveJoinKeysProbe.length > 0">
        <h4>Hash Keys Probe</h4>
        <ul class="small">
          <li v-for="(column, index) in adaptiveJoin.adaptiveJoinKeysProbe" :key="index"><sql-string :sql="column.toString()" :expandedColumns="expandedChildColumns"></sql-string></li>
        </ul>
      </div>
      <div v-if="adaptiveJoin.ProbeResidual !== undefined" class="content">
        <h4>Probe Residual</h4>
        <div class="small"><sql-string :sql="adaptiveJoin.ProbeResidual.ScalarOperator.ScalarString" :expandedColumns="expandedChildColumns"></sql-string></div>
      </div>
      <div v-if="adaptiveJoin.PassThru !== undefined" class="content">
        <h4>PassThru</h4>
        <div><sql-string :sql="adaptiveJoin.PassThru.ScalarOperator.ScalarString" :expandedColumns="expandedChildColumns"></sql-string></div>
      </div>
      <div v-if="adaptiveJoin.OuterReferences !== undefined && adaptiveJoin.OuterReferences.length > 0" class="content">
        <h4>Outer References</h4>
        <ul class="small">
          <li v-for="(column, index) in adaptiveJoin.OuterReferences" :key="index"><sql-string :sql="column.toString()" :expandedColumns="expandedChildColumns"></sql-string></li>
        </ul>
      </div>
      <div v-if="adaptiveJoin.BitmapCreator !== undefined" class="content">
        Bitmap Creator: <strong>{{ adaptiveJoin.BitmapCreator }} </strong>
      </div>
      <defined-values v-if="adaptiveJoin.DefinedValues !== undefined && adaptiveJoin.DefinedValues.length > 0" :definedValues="adaptiveJoin.DefinedValues" :expandedColumns="expandedChildColumns"></defined-values>
    </div>
</template>

<script lang='ts'>
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { RelOp, AdaptiveJoin, ExpandedComputedColumn } from '@/parser/showplan';

import DefinedValues from './DefinedValues.vue';
import SqlString from './SqlString.vue';

@Component({
  components: { DefinedValues, SqlString },
})
export default class AdaptiveJoinView extends Vue {
  @Prop() public operation!: RelOp;

  private get adaptiveJoin(): AdaptiveJoin {
    return this.operation.Action as AdaptiveJoin;
  }

  private get expandedChildColumns(): ExpandedComputedColumn[] {
    return this.operation.GetChildExpandedComputedColumns();
  }
}
</script>
