import type { Plugin } from "unified";
import type { Root, Element } from "hast";

type Options = {
  script?: string;
  scriptSetup?: string;
};

export const rehypeVueSfc: Plugin<[Options?], Root, Root> = (options = {}) => {
  return (root) => {
    let script: Element | null = null;
    let scriptSetup: Element | null = null;
    const styles: Element[] = [];
    const template: Element = {
      type: "element",
      tagName: "template",
      properties: {},
      children: [],
      content: {
        type: "root",
        children: root.children.filter((node) => {
          if (node.type === "element" && node.tagName === "style") {
            styles.push(node);
            return false;
          }
          if (node.type === "element" && node.tagName === "script") {
            if ("setup" in node.properties) {
              if (scriptSetup) {
                scriptSetup.children.push(...node.children);
              } else {
                scriptSetup = node;
              }
            } else {
              if (script) {
                script.children.push(...node.children);
              } else {
                script = node;
              }
            }
            return false;
          }
          return true;
        }),
      },
    };

    if (options.script) {
      script = script || {
        type: "element",
        tagName: "script",
        properties: {},
        children: [],
      };

      script.children.unshift({ type: "text", value: options.script });
    }

    if (options.scriptSetup) {
      scriptSetup = scriptSetup || {
        type: "element",
        tagName: "script",
        properties: { setup: "" },
        children: [],
      };

      scriptSetup.children.unshift({
        type: "text",
        value: options.scriptSetup,
      });
    }

    root.children = [template];
    if (script) root.children.push(script);
    if (scriptSetup) root.children.push(scriptSetup);
    root.children.push(...styles);

    return root;
  };
};
