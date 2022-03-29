import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

import { AgChartOptions } from "ag-charts-community";

import styles from './Launcher.module.scss';
import { openPlunker, getExampleInfo } from "../example-runner/helpers";
import { doOnEnter } from "../key-handlers";
import { useExampleFileNodes } from '../example-runner/use-example-file-nodes';

interface LauncherProps {
    framework: string;
    options: AgChartOptions;
}

export const Launcher = ({ framework, options }: LauncherProps) => {
    const exampleInfo = buildExampleInfo(framework, options);

    return <>
        <div
            className={styles['menu-item']}
            onClick={() => openPlunker(exampleInfo)}
            onKeyDown={e => doOnEnter(e, () => openPlunker(exampleInfo))}
            role="button"
            tabIndex={0}
        >
            <FontAwesomeIcon icon={faExternalLinkAlt} fixedWidth />
        </div>
    </>
};

interface ExampleFile {
    base: string;
    content?: Promise<string>;
    relativePath: string;
    publicURL: string;
}

interface ExampleInfo {
    title: string;
    sourcePath: string;
    framework: string;
    internalFramework: string;
    boilerplatePath: string;
    getFiles(...args: any[]): ExampleFile[];
}

const determineFrameworks = (framework: string) => {
    let useFunctionalReact = false;
    let useVue3 = false;
    let useTypescript = false;
    let mainFile = 'main.js';

    switch (framework) {
        case 'javascript':
        case 'vue':
            break;
        case 'angular':
            mainFile = 'app.component.ts';
            break;
        case 'react':
            mainFile = 'index.jsx';
            break;
        default:
            console.warn(`AG Grid Docs - unable to determine internalFramework for: ${framework}`);
            framework = 'javascript';
    }

    return { framework, useFunctionalReact, useVue3, useTypescript, mainFile };
};

const applyChartOptions = (name: string, source: string, options: AgChartOptions) => {
    const toInject = Object.entries(options)
        .filter(([_, value]) => value !== undefined)
        .map(([name, value]) => `  ${name}: ${JSON.stringify(value, null, 2)}`)
        .join(',\n');
    
    const modifiedSource = source.replace('  // INSERT OPTIONS HERE.', toInject);

    return Promise.resolve(modifiedSource);
}

const mutateMainFile = (file: ExampleFile, options: AgChartOptions) => {
    return {
        ...file,
        content: fetch(file.publicURL)
            .then(response => response.text())
            .then(source => applyChartOptions(file.base, source, options)),
    };
};

const mutateExampleInfo = (exampleInfo: ExampleInfo, mainFile: string, options: AgChartOptions) => {
    return {
        ...exampleInfo,
        // Patch main file with options configuration.
        getFiles: (...args) => {
            return exampleInfo.getFiles(...args)
                .map((file) => {
                    if (file.base.endsWith(mainFile)) {
                        return mutateMainFile(file, options);
                    }

                    return file;
                });
        },
    }
};

const buildExampleInfo = (providedFramework: string, options: AgChartOptions): ExampleInfo => {
    const { framework, useFunctionalReact, useVue3, useTypescript, mainFile } = determineFrameworks(providedFramework);
    const library = 'charts';
    const pageName = 'charts-api-explorer';
    const exampleName = 'baseline';
    const title = 'Charts API Explorer Generated Example';
    const type = 'generated';
    const exampleOptions = {};
    const exampleImportType = 'modules';

    const exampleInfo: ExampleInfo = getExampleInfo(
        useExampleFileNodes(),
        library,
        pageName,
        exampleName,
        title,
        type,
        exampleOptions,
        framework,
        useFunctionalReact,
        useVue3,
        useTypescript,
        exampleImportType,
    );

    return mutateExampleInfo(exampleInfo, mainFile, options);
};
