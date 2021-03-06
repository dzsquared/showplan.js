import * as ShowPlan from '@/parser/showplan';

const Colors: { [id: string]: string; } = {
  'performance': 'var(--green)',
  'reading-data': 'var(--blue)',
  'combining-data': 'var(--orange)',
  'modifying-data': 'var(--red)',
  'manipulating-data': 'var(--purple)',
  'grouping-data': 'var(--light-blue)',
  'remote': 'var(--brown)',
  'operation': 'var(--grey)',
  'root': 'var(--grey)',
};

type operationType =
  | 'reading-data'
  | 'manipulating-data'
  | 'modifying-data'
  | 'combining-data'
  | 'grouping-data'
  | 'remote'
  | 'operation'
  | 'performance'
  | 'root';

const GetOperationType = (physicalOp: ShowPlan.PhysicalOp): operationType => {
  switch (physicalOp) {
    case 'Constant Scan':
    case 'Clustered Index Scan':
    case 'Clustered Index Seek':
    case 'Index Seek':
    case 'Index Scan':
    case 'Table Scan':
    case 'RID Lookup':
    case 'Key Lookup':
    case 'Columnstore Index Scan':
    case 'Log Row Scan':
    case 'Deleted Scan':
    case 'Inserted Scan':
      return 'reading-data';
    case 'Nested Loops':
    case 'Merge Join':
    case 'Hash Match':
    case 'Adaptive Join':
    case 'Sequence':
    case 'Concatenation':
    case 'Switch':
      return 'combining-data';
    case 'Sort':
    case 'Stream Aggregate':
    case 'Window Aggregate':
    case 'Segment':
      return 'grouping-data';
    case 'Compute Scalar':
    case 'Filter':
    case 'Top':
    case 'Sequence Project':
      return 'manipulating-data';
    case 'Table Spool':
    case 'Row Count Spool':
    case 'Index Spool':
    case 'Window Spool':
    case 'Bitmap':
    case 'Parallelism':
    case 'Parameter Table Scan':
      return 'performance';
    case 'Table Delete':
    case 'Table Insert':
    case 'Table Merge':
    case 'Table Update':
    case 'Index Delete':
    case 'Index Insert':
    case 'Index Update':
    case 'Columnstore Index Delete':
    case 'Columnstore Index Insert':
    case 'Columnstore Index Merge':
    case 'Columnstore Index Update':
    case 'Clustered Index Delete':
    case 'Clustered Index Insert':
    case 'Clustered Index Merge':
    case 'Clustered Index Update':
    case 'Clustered Update':
    case 'Assert':
    case 'Split':
    case 'Collapse':
      return 'modifying-data';
    case 'Remote Delete':
    case 'Remote Index Scan':
    case 'Remote Index Seek':
    case 'Remote Insert':
    case 'Remote Query':
    case 'Remote Scan':
    case 'Remote Update':
      return 'remote';
    case 'Root':
      return 'root';
    default:
      return 'operation';
  }
};

const GetOperationColor = (physicalOp: ShowPlan.PhysicalOp): string => {
  return Colors[GetOperationType(physicalOp)];
};


export { Colors, GetOperationType, GetOperationColor };
