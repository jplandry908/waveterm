// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { VDomModel } from "@/app/view/vdom/vdom-model";
import type { CssNode, List, ListItem } from "css-tree";
import * as csstree from "css-tree";

const TextTag = "#text";

// TODO support binding
export function getTextChildren(elem: VDomElem): string {
    if (elem.tag == TextTag) {
        return elem.text;
    }
    if (!elem.children) {
        return null;
    }
    const textArr = elem.children.map((child) => {
        return getTextChildren(child);
    });
    return textArr.join("");
}

export function convertVDomId(model: VDomModel, id: string): string {
    return model.blockId + "::" + id;
}

export function validateAndWrapCss(model: VDomModel, cssText: string, wrapperClassName: string) {
    try {
        const ast = csstree.parse(cssText);
        csstree.walk(ast, {
            enter(node: CssNode, item: ListItem<CssNode>, list: List<CssNode>) {
                // Remove disallowed @rules
                const blockedRules = ["import", "font-face", "keyframes", "namespace", "supports"];
                if (node.type === "Atrule" && blockedRules.includes(node.name)) {
                    list.remove(item);
                }
                // Remove :root selectors
                if (
                    node.type === "Selector" &&
                    node.children.some((child) => child.type === "PseudoClassSelector" && child.name === "root")
                ) {
                    list.remove(item);
                }

                if (node.type === "IdSelector") {
                    node.name = convertVDomId(model, node.name);
                }

                // Transform url(#id) references in filter and mask properties (svg)
                if (node.type === "Declaration" && ["filter", "mask"].includes(node.property)) {
                    if (node.value && node.value.type === "Value" && "children" in node.value) {
                        const urlNode = node.value.children
                            .toArray()
                            .find(
                                (child: CssNode): child is CssNode & { value: string } =>
                                    child && child.type === "Url" && typeof (child as any).value === "string"
                            );
                        if (urlNode && urlNode.value && urlNode.value.startsWith("#")) {
                            urlNode.value = "#" + convertVDomId(model, urlNode.value.substring(1));
                        }
                    }
                }
                // transform url(vdom:///foo.jpg) => url(vdom://blockId/foo.jpg)
                if (node.type === "Url") {
                    const url = node.value;
                    if (url != null && url.startsWith("vdom://")) {
                        const absUrl = url.substring(7);
                        if (!absUrl.startsWith("/")) {
                            list.remove(item);
                        } else {
                            node.value = "vdom://" + model.blockId + url.substring(7);
                        }
                    }
                }
            },
        });
        const sanitizedCss = csstree.generate(ast);
        return `.${wrapperClassName} { ${sanitizedCss} }`;
    } catch (error) {
        // TODO better error handling
        console.error("CSS processing error:", error);
        return null;
    }
}

function cssTransformStyleValue(model: VDomModel, property: string, value: string): string {
    try {
        const ast = csstree.parse(value, { context: "value" });
        csstree.walk(ast, {
            enter(node) {
                // Transform url(#id) in filter/mask properties
                if (node.type === "Url" && (property === "filter" || property === "mask")) {
                    if (node.value.startsWith("#")) {
                        node.value = `#${convertVDomId(model, node.value.substring(1))}`;
                    }
                }

                // Transform vdom:/// URLs
                if (node.type === "Url" && node.value.startsWith("vdom:///")) {
                    const absUrl = node.value.substring(7);
                    if (absUrl.startsWith("/")) {
                        node.value = `vdom://${model.blockId}${absUrl}`;
                    }
                }
            },
        });

        return csstree.generate(ast);
    } catch (error) {
        console.error("Error processing style value:", error);
        return value;
    }
}

export function validateAndWrapReactStyle(model: VDomModel, style: Record<string, any>): Record<string, any> {
    const sanitizedStyle: Record<string, any> = {};
    let updated = false;
    for (const [property, value] of Object.entries(style)) {
        if (value == null || value === "") {
            continue;
        }
        if (typeof value !== "string") {
            sanitizedStyle[property] = value; // For non-string values, just copy as-is
            continue;
        }
        if (value.includes("vdom://") || value.includes("url(#")) {
            updated = true;
            sanitizedStyle[property] = cssTransformStyleValue(model, property, value);
        } else {
            sanitizedStyle[property] = value;
        }
    }
    if (!updated) {
        return style;
    }
    return sanitizedStyle;
}

type VDomTransferElem = {
    root?: boolean;
    waveid?: string;
    tag: string;
    props?: { [key: string]: any };
    children?: string[]; // References to child WaveIds
    text?: string;
};

export function UnmarshalTransferElems(transferElems: VDomTransferElem[]): VDomElem[] {
    const elemMap: { [id: string]: VDomElem } = {};
    const roots: VDomElem[] = [];

    // Initialize each VDomTransferElem in the map without children, as we'll link them after
    transferElems.forEach((transferElem) => {
        if (!transferElem.waveid) {
            return; // Skip elements without waveid
        }
        const elem: VDomElem = {
            waveid: transferElem.tag !== "#text" ? transferElem.waveid : undefined,
            tag: transferElem.tag,
            props: transferElem.props,
            text: transferElem.text,
            children: [], // Placeholder to be populated later
        };
        elemMap[transferElem.waveid] = elem;

        // Collect root elements
        if (transferElem.root) {
            roots.push(elem);
        }
    });

    // Now populate children for each element
    transferElems.forEach((transferElem) => {
        if (!transferElem.waveid || !transferElem.children) return;

        const currentElem = elemMap[transferElem.waveid];
        currentElem.children = transferElem.children
            .map((childId) => elemMap[childId])
            .filter((child) => child !== undefined); // Filter out any undefined children
    });

    return roots;
}