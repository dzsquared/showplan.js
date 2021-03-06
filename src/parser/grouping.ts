export class Group<T> {
  public key: string;
  public members: T[] = [];
  constructor(key: string) {
    this.key = key;
  }
}

export class Grouper  {
  public static groupBy<T>(list: T[], func: (x: T) => string): Array<Group<T>> {
    const res: Array<Group<T>> = [];
    let group: Group<T> | undefined;

    list.forEach((o) => {
      const groupName = func(o);
      if (group === undefined) {
        group = new Group<T>(groupName);
      }
      if (groupName !== group.key) {
        res.push(group);
        group = new Group<T>(groupName);
      }
      group.members.push(o);
    });

    if (group !== undefined) {
      res.push(group);
    }
    return res;
  }
}
