// Note: Assumes working directory is the root of the mono-repo
const fs = require('fs');
const path = require('path');

const pipe =
    (...fns) =>
    (x) =>
        fns.reduce((v, f) => f(v), x);

const ROOT_PACKAGE_JSON = '../../package.json';
const packageDirectories = require(ROOT_PACKAGE_JSON).workspaces.packages;

if (process.argv.length < 5) {
    console.log('Usage: node scripts/release/versionModules.js [New Version] [Dependency Version] [charts version]');
    console.log('For example: node scripts/release/versionModules.js 19.1.0 ^19.1.0 1.0.0');
    console.log('Note: This script should be run from the root of the monorepo');
    process.exit(1);
}

const [exec, scriptPath, gridNewVersion, dependencyVersion, chartsDependencyVersion] = process.argv;

function main() {
    updatePackageJsonFiles();
    updateRootPackageJson();
}

function updateAngularProject(CWD, packageDirectory) {
    const currentSubProjectPackageJsonFile = `${CWD}/${packageDirectory}/projects/ag-grid-angular/package.json`;
    updateFileWithNewVersions(currentSubProjectPackageJsonFile);
}

function updatePackageJsonFiles() {
    const CWD = process.cwd();

    packageDirectories.forEach((packageDirectory) => {
        // update all package.json files
        const packageJsonFile = `${CWD}/${packageDirectory}/package.json`;
        updateFileWithNewVersions(packageJsonFile);

        // angular projects have "sub" projects which we need to update
        if (packageDirectory.includes('angular')) {
            updateAngularProject(CWD, packageDirectory);
        }

        // update version.ts file
        const currentVersionFile = `${CWD}/${packageDirectory}/src/version.ts`;
        updateVersionFile(currentVersionFile);
    });
}

function updateRootPackageJson() {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, ROOT_PACKAGE_JSON), 'utf8'));
    packageJson.version = gridNewVersion;

    fs.writeFileSync(ROOT_PACKAGE_JSON, JSON.stringify(packageJson, null, 2), 'utf8');
}

function updateFileWithNewVersions(currentFile) {
    const packageJson = JSON.parse(fs.readFileSync(currentFile, 'utf8'));

    const updatedPackageJson = pipe(
        updateVersion,
        updateDependencies,
        updateDevDependencies,
        updatePeerDependencies
    )(packageJson);

    fs.writeFileSync(currentFile, JSON.stringify(updatedPackageJson, null, 2), 'utf8');
}

/**
 * Update `version.ts` file with version number if it exists
 */
function updateVersionFile(currentFile) {
    if (!fs.existsSync(currentFile)) {
        return;
    }

    fs.readFile(currentFile, 'utf8', (err, contents) => {
        const regex = /(export const VERSION =)(.*)$/m;
        const substitute = `$1 '${gridNewVersion}';`;
        const replacement = contents.replace(regex, substitute);

        fs.writeFileSync(currentFile, replacement, 'utf8');
    });
}

function updateVersion(packageJson) {
    packageJson.version = gridNewVersion;
    return packageJson;
}

function updateDependencies(fileContents) {
    return updateDependency(fileContents, 'dependencies', dependencyVersion, chartsDependencyVersion);
}

function updateDevDependencies(fileContents) {
    return updateDependency(fileContents, 'devDependencies', dependencyVersion, chartsDependencyVersion);
}

function updatePeerDependencies(fileContents) {
    return updateDependency(fileContents, 'peerDependencies', dependencyVersion, chartsDependencyVersion);
}

function updateDependency(fileContents, property, dependencyVersion, chartsDependencyVersion) {
    if (!fileContents[property]) {
        return fileContents;
    }
    const dependencyContents = fileContents[property];

    const gridDependency = function (key) {
        return key.startsWith('ag-grid') || key.startsWith('@ag-grid');
    };
    const chartDependency = function (key) {
        return key.startsWith('ag-charts') || key.startsWith('@ag-charts');
    };
    Object.entries(dependencyContents)
        .filter(([key, value]) => gridDependency(key) || chartDependency(key))
        .filter(([key, value]) => key !== 'ag-grid-testing')
        .forEach(([key, value]) => {
            if (chartsDependencyVersion) {
                dependencyContents[key] = chartDependency(key) ? chartsDependencyVersion : dependencyVersion;
            } else {
                dependencyContents[key] = dependencyVersion;
            }
        });

    return fileContents;
}

main();
