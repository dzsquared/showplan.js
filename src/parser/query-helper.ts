export class QueryHelper {
  public static GetImmediateChildNodesByTagName(node: Element, tagName: string): Element[] {
    const returnNodes: Element[] = [];
    let returnCounter = 0;
    const children = node.childNodes;

    // tslint:disable-next-line:prefer-for-of
    for (let nodeCounter = 0; nodeCounter < children.length; nodeCounter++) {
      if (children[nodeCounter].nodeType !== 1) {
        continue;
      }
      if ((children[nodeCounter] as Element).tagName === tagName) {
        returnNodes[returnCounter] = children[nodeCounter] as Element;
        returnCounter++;
      }
    }

    return returnNodes;
  }

  public static GetAllImmediateChildNodes(node: Element): Element[] {
    const returnNodes: Element[] = [];
    let returnCounter = 0;
    const children = node.childNodes;

    // tslint:disable-next-line:prefer-for-of
    for (let nodeCounter = 0; nodeCounter < children.length; nodeCounter++) {
      if (children[nodeCounter].nodeType !== 1) {
        continue;
      }

      returnNodes[returnCounter] = children[nodeCounter] as Element;
      returnCounter++;
    }

    return returnNodes;
  }

  public static ParseSingleItem<T>(
    element: Element,
    tagName: string,
    process: (element: Element) => T,
  ): T | undefined {
    const objectElements = this.GetImmediateChildNodesByTagName(element, tagName);
    if (objectElements.length === 1) {
      return process(objectElements[0]);
    }

    return undefined;
  }

  public static ParseAllItems<T>(
    element: Element,
    tagName: string,
    process: (element: Element) => T,
  ): T[] | undefined {
    const objectElements = this.GetImmediateChildNodesByTagName(element, tagName);
    if (objectElements.length === 0) {
      return undefined;
    }

    return objectElements.map((i) => process(i));
  }
}
