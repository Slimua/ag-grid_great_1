const path = require("path");
const fs = require("fs");
const commandLineOptions = require("commander");
const execa = require("execa");
const chokidar = require("chokidar");

commandLineOptions
    .option(
        "-w, --watch",
    )
    .option(
        "-s, --single",
    )
    .option(
        "-b, --build"
    )
    .option(
        "-t, --test"
    )
    .parse(process.argv);

const manifest = (dir = undefined) =>
    JSON.parse(
        fs.readFileSync(`${dir ? dir : process.cwd()}/package.json`, {
            encoding: "utf8"
        })
    );

const buildDependencies = async dependencies => {
    console.log("------------------------------------------------------------------------------------------");
    console.log(`Building ${dependencies.map(dependency => `--scope ${dependency}`).join(' ')}`);
    console.log("------------------------------------------------------------------------------------------");

    const scopedDependencies = dependencies.map(dependency => `--scope ${dependency}`).join(' ');
    const lernaArgs = `run build-docs ${scopedDependencies}`.split(" ");
    await execa("lerna", lernaArgs, { stdio: "inherit" });
};

const findParentPackageManifest = changedFile => {
    const startingPath = path.dirname(changedFile);

    const up = node => {
        let file = path.join(node, "package.json");

        if (fs.existsSync(file)) {
            return path.dirname(file);
        }

        file = path.resolve(node, "..");

        return up(file);
    };

    return up(startingPath);
};

const buildDependencyChain = async (changeFile, buildChains, singleModule) => {
    const packageName = manifest(findParentPackageManifest(changeFile)).name;

    const buildChain = buildChains[packageName];

    if(singleModule) {
        await buildDependencies(buildChain["0"]);
    } else {
        const maxIndex = Object.keys(buildChain).length;
        for (let i = 0; i < maxIndex; i++) {
            await buildDependencies(buildChain[i]);
        }
    }
};

const spawnWatcher = async ({paths, buildChains}, singleModule) => {
    await console.log(`Watching the following paths: ${paths.join('\n')}`);
    const log = console.log.bind(console);

    // Initialize the watcher
    let watcher = chokidar.watch(paths, {
        ignored: [
            /(^|[\/\\])\../, // ignore dotfiles
            /node_modules/, // ignore node_modules
            /lib|dist/, // ignore build output files
            /\*___jb_tmp___/ // ignore jetbrains IDE temp files
        ],
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true // Helps minimising thrashing of watch events
    });

    // Add event listeners
    return watcher
        .on("add", path => {
            log(`File ${path} has been added`);
            buildDependencyChain(path, buildChains, singleModule);
        })
        .on("change", path => {
            log(`File ${path} has been changed`);
            buildDependencyChain(path, buildChains, singleModule);
        })
        .on("unlink", path => {
            log(`File ${path} has been removed`);
            buildDependencyChain(path, buildChains, singleModule);
        });
};

const filterAgGridOnly = dependencyTree => {
    const prunedDependencyTree = {};
    const agRoots = Object.keys(dependencyTree);
    agRoots.forEach(root => {
        prunedDependencyTree[root] = dependencyTree[root] ? dependencyTree[root].filter(dependency => dependency.includes("@ag-")) : []
    });
    return prunedDependencyTree;
};

const buildBuildTree = (startingPackage, dependencyTree, dependenciesOrdered) => {
    let index = 0;
    let buildChain = {
        [index++]: [startingPackage]
    };
    delete dependencyTree[startingPackage];

    dependenciesOrdered.forEach(dependency => {
        buildChain[index] = [];

        const remainingPackages = Object.keys(dependencyTree);
        remainingPackages.forEach(remainingPackage => {
            dependencyTree[remainingPackage] = dependencyTree[remainingPackage].filter(packageDependency => packageDependency !== dependency);

            if (dependencyTree[remainingPackage].length === 0) {
                buildChain[index].push(remainingPackage);
                delete dependencyTree[remainingPackage];
            }
        });
        if (buildChain[index].length !== 0) {
            index++;
        }
    });

    delete buildChain[index];

    return buildChain;
};

const exclude = [
    'ag-grid-dev',
    'ag-grid-docs',
    'ag-grid-community',
    'ag-grid-enterprise'
];
const excludePackage = packageName => !exclude.includes(packageName) && !packageName.includes("-example")
// && !packageName.includes("-enterprise") && !packageName.includes("-angular") && !packageName.includes("-vue") && !packageName.includes("-react");

const filterExcludedRoots = dependencyTree => {
    const prunedDependencyTree = {};
    const agRoots = Object.keys(dependencyTree).filter(excludePackage);
    agRoots.forEach(root => {
        prunedDependencyTree[root] = dependencyTree[root] ? dependencyTree[root].filter(dependency => dependency.includes("@ag-")) : []
    });
    return prunedDependencyTree;
};

const getOrderedDependencies = async packageName => {
    const lernaArgs = `ls --all --sort --toposort --json --scope ${packageName} --include-dependents`.split(" ");
    const {stdout, stderr} = await execa("lerna", lernaArgs);
    let dependenciesOrdered = JSON.parse(stdout);
    dependenciesOrdered = dependenciesOrdered.filter(dependency => excludePackage(dependency.name));

    const paths = dependenciesOrdered.map(dependency => dependency.location);
    const orderedPackageNames = dependenciesOrdered.map(dependency => dependency.name);

    return {
        paths,
        orderedPackageNames
    }
};

const generateBuildChain = async (packageName, allPackagesOrdered) => {
    let lernaArgs = `ls --all --toposort --graph --scope ${packageName} --include-dependents`.split(" ");
    let {stdout} = await execa("lerna", lernaArgs);
    let dependencyTree = JSON.parse(stdout);
    dependencyTree = filterAgGridOnly(dependencyTree);
    dependencyTree = filterExcludedRoots(dependencyTree);

    return buildBuildTree(packageName, dependencyTree, allPackagesOrdered);
};

const test = async () => {
    let buildChainInfo = {};

    const cacheFilePath = path.resolve(__dirname, '../../.lernaBuildChain.cache.json');
    if(!fs.existsSync(cacheFilePath)) {
        const {paths, orderedPackageNames} = await getOrderedDependencies("@ag-grid-community/core");

        const buildChains = {};
        for (let packageName of orderedPackageNames) {
            buildChains[packageName] = await generateBuildChain(packageName, orderedPackageNames);
        }

        buildChainInfo = {
            paths,
            buildChains
        };

        fs.writeFileSync(cacheFilePath, JSON.stringify(buildChainInfo), 'UTF-8');
    } else {
        buildChainInfo = JSON.parse(fs.readFileSync(cacheFilePath, 'UTF-8'));
    }

    await buildDependencyChain('/Users/seanlandsman/IdeaProjects/ag/ag-grid/ag-grid/enterprise-modules/side-bar/src/sideBar/toolPanelWrapper.ts', buildChainInfo.buildChains)
};

const watch = async (singleModule) => {
    singleModule = singleModule || false;

    let buildChainInfo = {};

    const cacheFilePath = path.resolve(__dirname, '../../.lernaBuildChain.cache.json');
    if(!fs.existsSync(cacheFilePath)) {
        const {paths, orderedPackageNames} = await getOrderedDependencies("@ag-grid-community/core");

        const buildChains = {};
        for (let packageName of orderedPackageNames) {
            buildChains[packageName] = await generateBuildChain(packageName, orderedPackageNames);
        }

        buildChainInfo = {
            paths,
            buildChains
        };

        fs.writeFileSync(cacheFilePath, JSON.stringify(buildChainInfo), 'UTF-8');
    } else {
        buildChainInfo = JSON.parse(fs.readFileSync(cacheFilePath, 'UTF-8'));
    }

    spawnWatcher(buildChainInfo, singleModule);
};

const build = async () => {
    let buildChainInfo = {};

    const cacheFilePath = path.resolve(__dirname, '../../.lernaBuildChain.cache.json');
    if(!fs.existsSync(cacheFilePath)) {
        const {paths, orderedPackageNames} = await getOrderedDependencies("@ag-grid-community/core");

        const buildChains = {};
        for (let packageName of orderedPackageNames) {
            buildChains[packageName] = await generateBuildChain(packageName, orderedPackageNames);
        }

        buildChainInfo = {
            paths,
            buildChains
        };

        fs.writeFileSync(cacheFilePath, JSON.stringify(buildChainInfo), 'UTF-8');
    } else {
        buildChainInfo = JSON.parse(fs.readFileSync(cacheFilePath, 'UTF-8'));
    }

    await buildDependencyChain(path.resolve(__dirname, '../../community-modules/grid-core/src/gridCoreModule.ts'), buildChainInfo.buildChains)
};

if (commandLineOptions.watch) watch(false);
if (commandLineOptions.single) watch(true);
if (commandLineOptions.build) build();
if (commandLineOptions.test) test();

