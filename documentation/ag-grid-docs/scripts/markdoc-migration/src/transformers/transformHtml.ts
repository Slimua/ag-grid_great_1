import { brk, inlineCode, listItem, text } from 'mdast-builder';
import { visit } from 'unist-util-visit';

import { JSX_TEXT_TYPE, JSX_TYPE } from '../constants';
import { replaceNodeWithMarkdocTag } from '../utils/markdocTag';

function transformStyledList(ast: any) {
    visit(ast, { type: JSX_TYPE, name: 'ol' }, function (node) {
        const { attributes, children } = node;
        const contentArray = children[0].value.split('\n');
        const listItems = contentArray
            .map((item: string) => {
                return item.replace(/<li>(.*)<\/li>/, '$1').trim();
            })
            .flatMap((itemText: string, index: number) => {
                return index < contentArray.length - 1 ? [listItem(text(itemText)), brk] : [listItem(text(itemText))];
            });

        replaceNodeWithMarkdocTag({
            node,
            tagName: 'styledList',
            attributes,
            children: listItems,
            config: {
                style: {
                    type: 'string',
                    name: 'style',
                    transform(value) {
                        return value.replace(/list-style-type:\s?(.*);$/, '$1');
                    },
                },
            },
        });
    });
}

export function transformHtml(ast: any) {
    visit(
        ast,
        (node) => (node.type === JSX_TYPE || node.type === JSX_TEXT_TYPE) && node.name === 'br',
        (node) => {
            const { attributes, children } = node;
            replaceNodeWithMarkdocTag({
                node,
                tagName: 'br',
                attributes,
                children,
            });
        }
    );

    visit(ast, { type: JSX_TEXT_TYPE, name: 'kbd' }, function (node) {
        const { children } = node;

        const primaryAttribute = children[0].value;
        replaceNodeWithMarkdocTag({
            node,
            tagName: 'kbd',
            attributes: [],
            children: [],
            primaryAttribute,
        });
    });

    visit(ast, { type: JSX_TEXT_TYPE, name: 'code' }, function (node) {
        const { children } = node;
        const value = children[0].value;
        const replacement = inlineCode(value);
        node.type = replacement.type;
        node.value = replacement.value;
    });

    transformStyledList(ast);
}
