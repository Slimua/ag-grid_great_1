import type { InternalFramework } from '@ag-grid-types';
import {
    FILES_BASE_PATH,
    NPM_CDN,
    SITE_BASE_URL,
    agGridAngularVersion,
    agGridEnterpriseVersion,
    agGridReactVersion,
    agGridVersion,
    agGridVue3Version,
    agGridVueVersion,
} from '@constants';
import { isBuildServerBuild, isPreProductionBuild, isUsingPublishedPackages } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';

interface Props {
    boilerplatePath: string;
    appLocation: string;
    startFile: string;
    internalFramework: InternalFramework;
    isEnterprise: boolean;
    isDev: boolean;
}

type Paths = Record<string, string>;
interface Configuration {
    gridMap: Paths;
    gridCommunityPaths: Paths;
    gridEnterprisePaths: Paths;
}

const localPrefix = pathJoin(import.meta.env?.PUBLIC_SITE_URL, SITE_BASE_URL, FILES_BASE_PATH);

const localConfiguration: Configuration = {
    gridMap: {
        '@ag-grid-community/styles': `${localPrefix}/@ag-grid-community/styles`,
        '@ag-grid-community/react': `${localPrefix}/@ag-grid-community/react`,
        '@ag-grid-community/angular': `${localPrefix}/@ag-grid-community/angular`,
        '@ag-grid-community/vue': `${localPrefix}/@ag-grid-community/vue`,
        '@ag-grid-community/vue3': `${localPrefix}/@ag-grid-community/vue3`,
        'ag-grid-angular': `${localPrefix}/ag-grid-angular`,
        'ag-grid-react': `${localPrefix}/ag-grid-react`,
        'ag-grid-vue': `${localPrefix}/ag-grid-vue`,
        'ag-grid-vue3': `${localPrefix}/ag-grid-vue3`,
    },
    gridCommunityPaths: {
        'ag-grid-community': `${localPrefix}/ag-grid-community`,
        '@ag-grid-community/core': `${localPrefix}/@ag-grid-community/core/dist/package/main.cjs.js`,
        '@ag-grid-community/client-side-row-model': `${localPrefix}/@ag-grid-community/client-side-row-model/dist/package/main.cjs.js`,
        '@ag-grid-community/csv-export': `${localPrefix}/@ag-grid-community/csv-export/dist/package/main.cjs.js`,
        '@ag-grid-community/infinite-row-model': `${localPrefix}/@ag-grid-community/infinite-row-model/dist/package/main.cjs.js`
    },
    gridEnterprisePaths: {
        '@ag-grid-community/client-side-row-model': `${localPrefix}/@ag-grid-community/client-side-row-model/dist/package/main.cjs.js`,
        '@ag-grid-community/core': `${localPrefix}/@ag-grid-community/core/dist/package/main.cjs.js`,
        '@ag-grid-community/csv-export': `${localPrefix}/@ag-grid-community/csv-export/dist/package/main.cjs.js`,
        '@ag-grid-community/infinite-row-model': `${localPrefix}/@ag-grid-community/infinite-row-model/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/advanced-filter': `${localPrefix}/@ag-grid-enterprise/advanced-filter/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/charts': `${localPrefix}/@ag-grid-enterprise/charts/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/charts-enterprise': `${localPrefix}/@ag-grid-enterprise/charts-enterprise/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/clipboard': `${localPrefix}/@ag-grid-enterprise/clipboard/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/column-tool-panel': `${localPrefix}/@ag-grid-enterprise/column-tool-panel/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/core': `${localPrefix}/@ag-grid-enterprise/core/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/excel-export': `${localPrefix}/@ag-grid-enterprise/excel-export/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/filter-tool-panel': `${localPrefix}/@ag-grid-enterprise/filter-tool-panel/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/master-detail': `${localPrefix}/@ag-grid-enterprise/master-detail/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/menu': `${localPrefix}/@ag-grid-enterprise/menu/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/multi-filter': `${localPrefix}/@ag-grid-enterprise/multi-filter/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/range-selection': `${localPrefix}/@ag-grid-enterprise/range-selection/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/rich-select': `${localPrefix}/@ag-grid-enterprise/rich-select/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/row-grouping': `${localPrefix}/@ag-grid-enterprise/row-grouping/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/server-side-row-model': `${localPrefix}/@ag-grid-enterprise/server-side-row-model/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/set-filter': `${localPrefix}/@ag-grid-enterprise/set-filter/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/side-bar': `${localPrefix}/@ag-grid-enterprise/side-bar/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/sparklines': `${localPrefix}/@ag-grid-enterprise/sparklines/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/status-bar': `${localPrefix}/@ag-grid-enterprise/status-bar/dist/package/main.cjs.js`,
        '@ag-grid-enterprise/viewport-row-model': `${localPrefix}/@ag-grid-enterprise/viewport-row-model/dist/package/main.cjs.js`,
        'ag-grid-community': `${localPrefix}/ag-grid-community/dist/package/main.cjs.js`,
        'ag-grid-enterprise': `${localPrefix}/ag-grid-enterprise/dist/package/main.cjs.js`,
        'ag-grid-enterprise-charts-enterprise': `${localPrefix}/ag-grid-enterprise-charts-enterprise/dist/package/main.cjs.js`,
        "ag-charts-community": `${localPrefix}/ag-charts-community`,
        "ag-charts-enterprise": `${localPrefix}/ag-charts-enterprise`,
    },
};

const buildAndArchivesConfiguration: Configuration = {
    gridMap: {
    },
    gridCommunityPaths: {
    },
    gridEnterprisePaths: {
    },
};

const publishedConfiguration: Configuration = {
    gridMap: {
        '@ag-grid-community/styles': `${NPM_CDN}/@ag-grid-community/styles@${agGridVersion}`,
        '@ag-grid-community/react': `${NPM_CDN}/@ag-grid-community/react@${agGridReactVersion}/`,
        '@ag-grid-community/angular': `${NPM_CDN}/@ag-grid-community/angular@${agGridAngularVersion}/`,
        '@ag-grid-community/vue': `${NPM_CDN}/@ag-grid-community/vue@${agGridVueVersion}/`,
        '@ag-grid-community/vue3': `${NPM_CDN}/@ag-grid-community/vue3@${agGridVue3Version}/`,
        'ag-grid-community': `${NPM_CDN}/ag-grid-community@${agGridVersion}`,
        'ag-grid-enterprise': `${NPM_CDN}/ag-grid-enterprise@${agGridEnterpriseVersion}/`,
        'ag-grid-enterprise-charts-enterprise': `${NPM_CDN}/ag-grid-enterprise-charts-enterprise@${agGridEnterpriseVersion}/`,
        'ag-grid-angular': `${NPM_CDN}/ag-grid-angular@${agGridAngularVersion}/`,
        'ag-grid-react': `${NPM_CDN}/ag-grid-react@${agGridReactVersion}/`,
        'ag-grid-vue': `${NPM_CDN}/ag-grid-vue@${agGridVueVersion}/`,
        'ag-grid-vue3': `${NPM_CDN}/ag-grid-vue3@${agGridVue3Version}/`,
    },
    gridCommunityPaths: {
        'ag-charts-react': `${NPM_CDN}/ag-charts-react/`,
        'ag-charts-angular': `${NPM_CDN}/ag-charts-angular/`,
        'ag-charts-vue': `${NPM_CDN}/ag-charts-vue/`,
        'ag-charts-vue3': `${NPM_CDN}/ag-charts-vue3/`,
        'ag-charts-community': `${NPM_CDN}/ag-charts-community/`,
        '@ag-grid-community/client-side-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-community/client-side-row-model@${agGridVersion}/dist/client-side-row-model.cjs.min.js`,
        '@ag-grid-community/core': `https://cdn.jsdelivr.net/npm/@ag-grid-community/core@${agGridVersion}/dist/core.cjs.min.js`,
        '@ag-grid-community/csv-export': `https://cdn.jsdelivr.net/npm/@ag-grid-community/csv-export@${agGridVersion}/dist/csv-export.cjs.min.js`,
        '@ag-grid-community/infinite-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-community/infinite-row-model@${agGridVersion}/dist/infinite-row-model.cjs.min.js`,
    },
    gridEnterprisePaths: {
        'ag-charts-react': `${NPM_CDN}/ag-charts-react/`,
        'ag-charts-angular': `${NPM_CDN}/ag-charts-angular/`,
        'ag-charts-vue': `${NPM_CDN}/ag-charts-vue/`,
        'ag-charts-vue3': `${NPM_CDN}/ag-charts-vue3/`,
        'ag-charts-community': `${NPM_CDN}/ag-charts-community/`,
        '@ag-grid-community/client-side-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-community/client-side-row-model@${agGridVersion}/dist/client-side-row-model.cjs.min.js`,
        '@ag-grid-community/core': `https://cdn.jsdelivr.net/npm/@ag-grid-community/core@${agGridVersion}/dist/core.cjs.min.js`,
        '@ag-grid-community/csv-export': `https://cdn.jsdelivr.net/npm/@ag-grid-community/csv-export@${agGridVersion}/dist/csv-export.cjs.min.js`,
        '@ag-grid-community/infinite-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-community/infinite-row-model@${agGridVersion}/dist/infinite-row-model.cjs.min.js`,
        '@ag-grid-enterprise/advanced-filter': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/advanced-filter@${agGridVersion}/dist/advanced-filter.cjs.min.js`,
        '@ag-grid-enterprise/charts': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/charts@${agGridVersion}/dist/charts.cjs.min.js`,
        '@ag-grid-enterprise/charts-enterprise': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/charts-enterprise@${agGridVersion}/dist/charts-enterprise.cjs.min.js`,
        '@ag-grid-enterprise/clipboard': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/clipboard@${agGridVersion}/dist/clipboard.cjs.min.js`,
        '@ag-grid-enterprise/column-tool-panel': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/column-tool-panel@${agGridVersion}/dist/column-tool-panel.cjs.min.js`,
        '@ag-grid-enterprise/core': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/core@${agGridVersion}/dist/core.cjs.min.js`,
        '@ag-grid-enterprise/excel-export': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/excel-export@${agGridVersion}/dist/excel-export.cjs.min.js`,
        '@ag-grid-enterprise/filter-tool-panel': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/filter-tool-panel@${agGridVersion}/dist/filter-tool-panel.cjs.min.js`,
        '@ag-grid-enterprise/master-detail': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/master-detail@${agGridVersion}/dist/master-detail.cjs.min.js`,
        '@ag-grid-enterprise/menu': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/menu@${agGridVersion}/dist/menu.cjs.min.js`,
        '@ag-grid-enterprise/multi-filter': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/multi-filter@${agGridVersion}/dist/multi-filter.cjs.min.js`,
        '@ag-grid-enterprise/range-selection': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/range-selection@${agGridVersion}/dist/range-selection.cjs.min.js`,
        '@ag-grid-enterprise/rich-select': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/rich-select@${agGridVersion}/dist/rich-select.cjs.min.js`,
        '@ag-grid-enterprise/row-grouping': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/row-grouping@${agGridVersion}/dist/row-grouping.cjs.min.js`,
        '@ag-grid-enterprise/server-side-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/server-side-row-model@${agGridVersion}/dist/server-side-row-model.cjs.min.js`,
        '@ag-grid-enterprise/set-filter': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/set-filter@${agGridVersion}/dist/set-filter.cjs.min.js`,
        '@ag-grid-enterprise/side-bar': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/side-bar@${agGridVersion}/dist/side-bar.cjs.min.js`,
        '@ag-grid-enterprise/sparklines': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/sparklines@${agGridVersion}/dist/sparklines.cjs.min.js`,
        '@ag-grid-enterprise/status-bar': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/status-bar@${agGridVersion}/dist/status-bar.cjs.min.js`,
        '@ag-grid-enterprise/viewport-row-model': `https://cdn.jsdelivr.net/npm/@ag-grid-enterprise/viewport-row-model@${agGridVersion}/dist/viewport-row-model.cjs.min.js`,
    },
};

function getRelevantConfig(configuration: Configuration, framework: InternalFramework) {
    const filterByFramework = ([k]: string[]) => {
        const inverseFrameworks: Record<string, string[]> = {
            reactFunctional: ['angular', 'vue', 'vue3'],
            reactFunctionalTs: ['angular', 'vue', 'vue3'],
            angular: ['react', 'vue', 'vue3'],
            vue: ['angular', 'react', 'vue3'],
            vue3: ['angular', 'react', 'vue'],
            typescript: ['angular', 'react', 'vue', 'vue3'],
        };
        return !inverseFrameworks[framework].some((f) => k.endsWith(f));
    };

    const filterOutChartWrapper = ([k]: string[]) => {
        // integrated does not need the charts framework wrapper
        if (k.includes('ag-charts')) {
            return k !== `ag-charts-${framework}`;
        }
        return true;
    };

    const buildCopy = (config: Paths) => {
        let valid = {} as Paths;
        Object.entries(config)
            .filter(filterOutChartWrapper)
            .filter(filterByFramework)
            .sort(([k1, v1], [k2, v2]) => (k1 < k2 ? -1 : 1))
            .forEach(([k, v]) => {
                valid[k] = v;
            });
        return valid;
    };

    return {
        gridMap: buildCopy(configuration.gridMap),
        gridCommunityPaths: buildCopy(configuration.gridCommunityPaths),
        gridEnterprisePaths: buildCopy(configuration.gridEnterprisePaths),
    };
}

/**
 * Our framework examples use SystemJS to load the various dependencies. This component is used to insert the required
 * code to load SystemJS and the relevant modules depending on the framework.
 */
export const SystemJs = ({
    boilerplatePath,
    appLocation,
    startFile,
    internalFramework,
    isEnterprise,
    isDev,
}: Props) => {
    const systemJsPath = pathJoin(boilerplatePath, `systemjs.config${isDev ? '.dev' : ''}.js`);
    let configuration = isUsingPublishedPackages()
        ? publishedConfiguration
        : isBuildServerBuild() || isPreProductionBuild()
          ? buildAndArchivesConfiguration
          : localConfiguration;

    if (isDev) {
        configuration.gridMap = {
            ...configuration.gridMap,
            '@ag-grid-community/client-side-row-model': `${localPrefix}/@ag-grid-community/client-side-row-model`,
            '@ag-grid-community/core': `${localPrefix}/@ag-grid-community/core`,
            '@ag-grid-community/csv-export': `${localPrefix}/@ag-grid-community/csv-export`,
            '@ag-grid-community/infinite-row-model': `${localPrefix}/@ag-grid-community/infinite-row-model`,
            '@ag-grid-enterprise/advanced-filter': `${localPrefix}/@ag-grid-enterprise/advanced-filter`,
            '@ag-grid-enterprise/charts': `${localPrefix}/@ag-grid-enterprise/charts`,
            '@ag-grid-enterprise/charts-enterprise': `${localPrefix}/@ag-grid-enterprise/charts-enterprise`,
            '@ag-grid-enterprise/clipboard': `${localPrefix}/@ag-grid-enterprise/clipboard`,
            '@ag-grid-enterprise/column-tool-panel': `${localPrefix}/@ag-grid-enterprise/column-tool-panel`,
            '@ag-grid-enterprise/core': `${localPrefix}/@ag-grid-enterprise/core`,
            '@ag-grid-enterprise/excel-export': `${localPrefix}/@ag-grid-enterprise/excel-export`,
            '@ag-grid-enterprise/filter-tool-panel': `${localPrefix}/@ag-grid-enterprise/filter-tool-panel`,
            '@ag-grid-enterprise/master-detail': `${localPrefix}/@ag-grid-enterprise/master-detail`,
            '@ag-grid-enterprise/menu': `${localPrefix}/@ag-grid-enterprise/menu`,
            '@ag-grid-enterprise/multi-filter': `${localPrefix}/@ag-grid-enterprise/multi-filter`,
            '@ag-grid-enterprise/range-selection': `${localPrefix}/@ag-grid-enterprise/range-selection`,
            '@ag-grid-enterprise/rich-select': `${localPrefix}/@ag-grid-enterprise/rich-select`,
            '@ag-grid-enterprise/row-grouping': `${localPrefix}/@ag-grid-enterprise/row-grouping`,
            '@ag-grid-enterprise/server-side-row-model': `${localPrefix}/@ag-grid-enterprise/server-side-row-model`,
            '@ag-grid-enterprise/set-filter': `${localPrefix}/@ag-grid-enterprise/set-filter`,
            '@ag-grid-enterprise/side-bar': `${localPrefix}/@ag-grid-enterprise/side-bar`,
            '@ag-grid-enterprise/sparklines': `${localPrefix}/@ag-grid-enterprise/sparklines`,
            '@ag-grid-enterprise/status-bar': `${localPrefix}/@ag-grid-enterprise/status-bar`,
            '@ag-grid-enterprise/viewport-row-model': `${localPrefix}/@ag-grid-enterprise/viewport-row-model`,
        };
    }
    configuration = getRelevantConfig(configuration, internalFramework);

    let systemJsMap = configuration.gridMap;
    let systemJsPaths = { ...(isEnterprise ? configuration.gridEnterprisePaths : configuration.gridCommunityPaths) };

    let systemJsVersion = `${NPM_CDN}/systemjs@0.19.47/dist/system.js`;
    if (internalFramework === 'angular') {
        // Angular needs a later version to be able to import @esm-bundle/angular__compiler which
        // it requires to correctly renderer dynamic components.
        systemJsVersion = `${NPM_CDN}/systemjs@0.21.6/dist/system.js`;
    }

    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            var appLocation = '${appLocation}';
            var boilerplatePath = '${boilerplatePath}';
            var systemJsMap = ${format(systemJsMap)};
            ${Object.keys(systemJsPaths).length > 0 ? `var systemJsPaths = ${format(systemJsPaths)};` : ''}
        `,
                }}
            />
            <script src={systemJsVersion} />
            <script src={systemJsPath} />
            <script
                dangerouslySetInnerHTML={{
                    __html: `System.import('${startFile}').catch(function(err) { console.error(err); });`,
                }}
            />
        </>
    );
};

const format = (value: object) => JSON.stringify(value, null, 4).replace(/\n/g, '\n            ');
