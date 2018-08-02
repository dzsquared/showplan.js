import { ShowPlanParser } from '@/parser/showplan-parser';
import * as ShowPlan from '@/parser/showplan';
import { expect } from 'chai';

// tslint:disable-next-line:no-var-requires
const fs = require('fs');

describe('nested-loops.sqlplan', () => {
  const file = 'tests/unit/plan-parser/plans/nested-loops.sqlplan';
  let plan: ShowPlan.ShowPlanXML;

  before(function() {
    const data = fs.readFileSync(file, 'utf16le');
    const parse = new ShowPlanParser();
    plan = parse.Parse(data);
  });

  it('first operation is a nested loop', function() {
    const statement = plan.Batches[0].Statements[0] as ShowPlan.StmtSimple;
    expect(statement.QueryPlan!.RelOp.Action).to.be.instanceof(ShowPlan.NestedLoops);

    const nestedLoops = statement.QueryPlan!.RelOp.Action as ShowPlan.NestedLoops;
    expect(nestedLoops.RelOp).to.have.length(2);

    expect(nestedLoops.OuterReferences![0].Column).to.equal('OwnerUserId');
  });

  it('predicate is parsed correctly', function() {
    const statement = plan.Batches[0].Statements[0] as ShowPlan.StmtSimple;
    const action = statement.QueryPlan!.RelOp.Action
      .RelOp[1].Action as ShowPlan.IndexScan;

    expect(action.SeekPredicates!.SeekPredicateNew).to.have.length(1);
    expect(action.SeekPredicates!.SeekPredicateNew![0].SeekKeys[0].Prefix!.RangeColumns[0].Column).to.not.be.undefined;

  });
});
