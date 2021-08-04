const fs = require('fs');
const ts = require('typescript');
const glob = require('glob');
const gulp = require('gulp');
const prettier = require('gulp-prettier');
const { ComponentUtil } = require("@ag-grid-community/core");
const { getFormatterForTS } = require('../../../scripts/formatAST');

const formatNode = getFormatterForTS(ts);

const EVENT_LOOKUP = new Set(ComponentUtil.getEventCallbacks());

function findInterfaceNode(interfaceName, parsedSyntaxTreeResults) {
    const interfaceNode = findInterfaceInNodeTree(parsedSyntaxTreeResults, interfaceName);
    if (!interfaceNode) {
        throw `Unable to locate interface '${interfaceName}' in AST parsed from: ${sourceFile}.`
    }
    return interfaceNode;
}

function findInterfaceInNodeTree(node, interfaceName) {
    const kind = ts.SyntaxKind[node.kind];

    if (kind == 'InterfaceDeclaration' && node && node.name && node.name.escapedText == interfaceName) {
        return node;
    }
    let interfaceNode = undefined;
    ts.forEachChild(node, n => {
        if (!interfaceNode) {
            interfaceNode = findInterfaceInNodeTree(n, interfaceName);
        }
    });

    return interfaceNode;
}

function findAllInterfacesInNodesTree(node) {
    const kind = ts.SyntaxKind[node.kind];
    let interfaces = [];
    if (kind == 'InterfaceDeclaration' || kind == 'EnumDeclaration' || kind == 'TypeAliasDeclaration') {
        interfaces.push(node);
    }
    ts.forEachChild(node, n => {
        const nodeInterfaces = findAllInterfacesInNodesTree(n);
        if (nodeInterfaces.length > 0) {
            interfaces = [...interfaces, ...nodeInterfaces];
        }
    });

    return interfaces;
}

function getJsDoc(node) {
    if (node.jsDoc) {
        const printer = ts.createPrinter();
        const result = node.jsDoc.map(j => printer.printNode(ts.EmitHint.Unspecified, j)).join('\n');
        return result;
    }
};

function getArgTypes(parameters, file) {
    const args = {};
    (parameters || []).forEach(p => {
        args[p.name.escapedText] = formatNode(p.type, file);
    });
    return args;
}

function toCamelCase(value) {
    return value[0].toLowerCase() + value.substr(1);
}

function extractTypesFromNode(node, srcFile) {
    let nodeMembers = {};
    const kind = ts.SyntaxKind[node.kind];
    let name = node && node.name && node.name.escapedText;
    let returnType = node && node.type && node.type.getFullText().trim();

    if (kind == 'PropertySignature') {

        if (node.type && node.type.parameters) {
            // sendToClipboard?: (params: SendToClipboardParams) => void;
            const methodArgs = getArgTypes(node.type.parameters, srcFile);
            returnType = formatNode(node.type.type, srcFile);
            nodeMembers[name] = {
                description: getJsDoc(node),
                type: { arguments: methodArgs, returnType }
            };
        } else {
            // i.e colWidth?: number; 
            nodeMembers[name] = { description: getJsDoc(node), type: { returnType } };
        }
    } else if (kind == 'MethodSignature') {
        // i.e isExternalFilterPresent?(): boolean;
        // i.e doesExternalFilterPass?(node: RowNode): boolean;        
        const methodArgs = getArgTypes(node.parameters, srcFile);

        nodeMembers[name] = {
            description: getJsDoc(node),
            type: { arguments: methodArgs, returnType }
        };

        if (EVENT_LOOKUP.has(name)) {
            // Duplicate events without their prefix
            let shortName = name.substr(2);
            shortName = toCamelCase(shortName);

            nodeMembers[shortName] = { ...nodeMembers[name], meta: { isEvent: true, name } };
            nodeMembers[name] = { ...nodeMembers[name], meta: { isEvent: true, name } };
        }

    }
    return nodeMembers;
}

function parseFile(sourceFile) {
    const src = fs.readFileSync(sourceFile, 'utf8');
    return ts.createSourceFile('tempFile.ts', src, ts.ScriptTarget.Latest, true);
}

function getInterfaces() {
    const interfaceFiles = glob.sync('../../../community-modules/core/src/ts/**/*.ts');

    let interfaces = {};
    let extensions = {};
    interfaceFiles.forEach(file => {
        const parsedFile = parseFile(file);
        interfaces = { ...interfaces, ...extractInterfaces(parsedFile, extensions) };
    });

    // Now that we have recorded all the interfaces we can apply the extension properties.
    // For example CellPosition extends RowPosition and we want the json to add the RowPosition properties to the CellPosition
    Object.entries(extensions).forEach(([i, exts]) => {

        const getAncestors = (child) => {
            let ancestors = [];
            const extended = typeof (child) === 'string' ? child : child.extends;
            const parents = extensions[extended];
            if (parents) {
                ancestors = [...ancestors, ...parents];
                parents.forEach(p => {
                    ancestors = [...ancestors, ...getAncestors(p)]
                })
            }
            return ancestors;
        }

        const mergeAncestorProps = (parent, child, getProps) => {

            const props = { ...getProps(child) };
            let mergedProps = props;
            // If the parent has a generic params lets apply the child's specific types
            if (parent.params && parent.params.length > 0) {

                if (child.meta.typeParams) {
                    child.meta.typeParams.forEach((t, i) => {
                        Object.entries(props).forEach(([k, v]) => {
                            delete mergedProps[k];
                            // Replace the generic params. Regex to make sure you are not just replacing 
                            // random letters in variable names.
                            var rep = `(?<!\\w)${t}(?!\\w)`;
                            var re = new RegExp(rep, "g");
                            var newKey = k.replace(re, parent.params[i]);
                            var newValue = v.replace(re, parent.params[i])
                            mergedProps[newKey] = newValue;
                        })
                    })
                } else {
                    throw new Error(`Parent interface ${parent.extends} takes generic params: [${parent.params.join()}] but child does not have typeParams.`)
                }
            }

            return mergedProps
        }


        const allAncestors = getAncestors(i);
        let extendedInterface = interfaces[i];
        allAncestors.forEach(a => {
            const extended = a.extends;
            let aI = interfaces[extended];
            if (!aI) {
                //Check for type params                
                throw new Error('Missing interface', a)
            }
            if (aI && aI.type) {
                extendedInterface.type = { ...mergeAncestorProps(a, aI, a => a.type), ...extendedInterface.type }
            }
            if (aI && aI.docs) {
                extendedInterface.docs = { ...mergeAncestorProps(a, aI, a => a.docs), ...extendedInterface.docs }
            }
        })

        interfaces[i] = extendedInterface;
    })
    return interfaces;
}

function getGridOptions() {
    const gridOpsFile = "../../../community-modules/core/src/ts/entities/gridOptions.ts";
    const srcFile = parseFile(gridOpsFile);
    const gridOptionsNode = findInterfaceNode('GridOptions', srcFile);

    let gridOpsMembers = {};
    ts.forEachChild(gridOptionsNode, n => {
        gridOpsMembers = { ...gridOpsMembers, ...extractTypesFromNode(n, srcFile) }
    });

    return gridOpsMembers;
}

function writeFormattedFile(dir, filename, data) {
    const fullPath = dir + filename;
    fs.writeFileSync(fullPath, JSON.stringify(data));
    gulp.src(fullPath)
        .pipe(prettier({}))
        .pipe(gulp.dest(dir))
}

function extractInterfaces(srcFile, extension) {
    const interfaces = findAllInterfacesInNodesTree(srcFile);
    const iLookup = {};
    interfaces.forEach(node => {
        const name = node && node.name && node.name.escapedText;
        const kind = ts.SyntaxKind[node.kind];

        if (node.heritageClauses && node.heritageClauses) {
            node.heritageClauses.forEach(h => {
                if (h.types && h.types.length > 0) {
                    extension[name] = h.types.map(h => ({ extends: formatNode(h.expression, srcFile), params: h.typeArguments ? h.typeArguments.map(t => formatNode(t, srcFile)) : undefined }));
                }
            });
        }

        if (kind == 'EnumDeclaration') {
            iLookup[name] = { meta: { isEnum: true }, type: node.members.map(n => formatNode(n, srcFile)) }
        } else if (kind == 'TypeAliasDeclaration' && node.type && node.type.types && !node.typeParameters) {
            iLookup[name] = { meta: { isTypeAlias: true }, type: formatNode(node.type, srcFile) }
        } else {

            let isCallSignature = false;
            let members = {};
            let docs = {};
            let callSignatureMembers = {};

            if (node.members && node.members.length > 0) {
                node.members.map(p => {
                    isCallSignature = isCallSignature || ts.SyntaxKind[p.kind] == 'CallSignature';
                    if (isCallSignature) {

                        const arguments = {};

                        (p.parameters || []).forEach(callArg => {
                            arguments[formatNode(callArg.name, srcFile)] = formatNode(callArg.type, srcFile);
                        })

                        callSignatureMembers = {
                            arguments,
                            returnType: formatNode(p.type, srcFile),
                        }
                    } else {
                        const propName = formatNode(p, srcFile, true);
                        const propType = formatNode(p.type, srcFile);
                        members[propName] = propType;
                        const doc = getJsDoc(p);
                        if (doc) {
                            docs[propName] = getJsDoc(p);
                        }
                    }

                });

                if (isCallSignature && node.members.length > 1) {
                    throw new Error('Have a callSignature interface with more than one member! We were not expecting this to be possible!');
                }
            }
            if (isCallSignature) {
                iLookup[name] = {
                    meta: { isCallSignature },
                    type: callSignatureMembers
                }
            } else {
                let meta = {};
                iLookup[name] = { meta, type: members, docs: Object.entries(docs).length > 0 ? docs : undefined }
            }

            if (node.typeParameters) {
                const orig = iLookup[name];
                iLookup[name] = { ...orig, meta: { ...orig.meta, typeParams: node.typeParameters.map(tp => formatNode(tp, srcFile)) } }
            }

            const doc = getJsDoc(node);
            if (doc) {
                const orig = iLookup[name];
                iLookup[name] = { ...orig, meta: { ...orig.meta, doc } }
            }
        }
    });
    return iLookup;
}

const generateMetaFiles = (resolve) => {
    writeFormattedFile('./doc-pages/grid-api/', 'grid-options.json', getGridOptions());
    writeFormattedFile('./doc-pages/grid-api/', 'interfaces.json', getInterfaces());
    resolve()
};

const generateCodeReferenceFiles = () => {
    return new Promise(resolve => generateMetaFiles(resolve));
}

console.log(`--------------------------------------------------------------------------------`);
console.log(`Generate docs reference files...`);
console.log('Using Typescript version: ', ts.version)

const success = [
    generateCodeReferenceFiles(),
].every(x => x);

if (success) {
    console.log(`Finished!`);
} else {
    console.error('Failed.');
    process.exitCode = 1;
}

console.log(`--------------------------------------------------------------------------------`);


