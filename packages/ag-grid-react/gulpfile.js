const fs = require('fs');
const gulp = require('gulp');
const {series} = require('gulp');
const gulpTypescript = require('gulp-typescript');
const header = require('gulp-header');
const merge = require('gulp-merge');
const pkg = require('./package.json');
const tsConfig = 'tsconfig.build.json';
const typescript = require('rollup-plugin-typescript');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const clean = require('gulp-clean');
const link = require('lnk').sync;
const os = require('os');

const WINDOWS = /^win/.test(os.platform());

const headerTemplate = '// <%= pkg.name %> v<%= pkg.version %>\n';

const cleanLib = () => {
    return gulp
        .src('lib', {read: false, allowEmpty: true})
        .pipe(clean());
};

tscTask = async () => {
    const tscProject = gulpTypescript.createProject(tsConfig);
    const tsResult = await gulp.src(
        [
            'src/**/*.ts',
            '!src/**/__tests__/**/*',
            '!src/**/setupTests.ts'
        ]
    ).pipe(tscProject());

    return merge([
        tsResult.dts.pipe(header(headerTemplate, {pkg: pkg})).pipe(gulp.dest('lib')),
        tsResult.js.pipe(header(headerTemplate, {pkg: pkg})).pipe(gulp.dest('lib'))
    ]);
};

const cleanUmd = () => {
    return gulp.src('umd/*')
        .pipe(clean({read: false, force: true}));
};

const umd = () => {
    return rollup({
        input: './src/main.ts',
        rollup: require('rollup'),
        output: {
            name: 'AgGridReact',
            file: 'my-file.umd.js',
            format: 'umd',
            globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'prop-types': 'PropTypes',
                'ag-grid-community': 'agGrid'
            },
        },
        plugins: [typescript(), commonjs(),
            uglify()
        ]
    })
        .pipe(source('ag-grid-react.min.js'))
        .pipe(gulp.dest('./umd'))
};

const watch = () => {
    gulp.watch([
            './src/*',
            './node_modules/ag-grid-community/dist/lib/**/*'],
        tscTask);
};

const linkUmdForE2E = (done) => {
    let linkType = 'symbolic';
    if (WINDOWS) {
        console.log('creating window links...');
        linkType = 'junction';
    }

    if(!fs.existsSync('./cypress/integration/ag-grid-react.min.js')) {
        link('./umd/ag-grid-react.min.js', './cypress/integration/',{
            force: true,
            type: linkType
        })
    }
    if(!fs.existsSync('./cypress/integration/ag-grid-community.min.js')) {
        link('../../community-modules/grid-all-modules/dist/ag-grid-community.min.js', './cypress/integration/',{
            force: true,
            type: linkType
        })
    }
    done();
};

gulp.task('clean-umd', cleanUmd);
gulp.task('umd', umd);
gulp.task('link-umd-e2e', linkUmdForE2E);
gulp.task('clean-lib', cleanLib);
gulp.task('tsc', tscTask);
gulp.task('watch', series('tsc', watch));
gulp.task('default', series('clean-lib', 'tsc', "clean-umd", "umd"));
