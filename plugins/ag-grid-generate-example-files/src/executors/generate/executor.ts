/* eslint-disable no-console */
import path from 'path';

import { writeFile } from '../../executors-utils';
import { getGeneratedContents } from './generator/examplesGenerator';
import { FRAMEWORKS } from './generator/types';

export type ExecutorOptions = {
    mode: 'dev' | 'prod';
    outputPath: string;
    examplePath: string;
    inputs: string[];
    output: string;
};

export default async function (options: ExecutorOptions) {
    try {
        await generateFiles(options);

        return { success: true, terminalOutput: `Generating example [${options.examplePath}]` };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function generateFiles(options: ExecutorOptions) {
    for (const importType of ['modules', 'packages'] as const) {        
        for (const internalFramework of FRAMEWORKS) {
            const result = await getGeneratedContents({
                folderPath: options.examplePath,
                internalFramework,
                isDev: options.mode === 'dev',
                importType
            });

            const outputPath = path.join(options.outputPath, importType, internalFramework, 'contents.json');
            await writeFile(outputPath, JSON.stringify(result));

            for (const name in result.generatedFiles) {
                if (typeof result.generatedFiles[name] !== 'string') {
                    throw new Error(`${outputPath}: non-string file content`);
                }
            }
        }
    }
}
