const gulp = require('gulp');
const rename = require('gulp-rename');
const del = require('del');

const through = require('through2');
const colors = require('ansi-colors');
const log = require('fancy-log');
const argv = require('minimist')(process.argv.slice(2));

const postcss = require('gulp-postcss');
const pxtorps = require('postcss-px2rpx');
const base64 = require('postcss-font-base64');

const sass = require('gulp-sass');
const jsonminify = require('gulp-jsonminify');
const combiner = require('stream-combiner2');
const terser = require('gulp-terser');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const filter = require('gulp-filter');
const jdists = require('gulp-jdists');

const src = './client';
const dist = './dist';
const isProd = argv.type === 'prod';


// cloud-functions 处理方法
const cloudPath = './server/cloudfunction';
function cloudTask() {
    return gulp 
        .src(`${cloudPath}/**`)
        .pipe(
            isProd
                ? jdists({
                    trigger: 'prod'
                })
                : jdists({
                    trigger: 'dev'
                })
        )
        .pipe(gulp.dest(`${dist}/cloudfunction`));
}
function watchCloud() {
    gulp.watch(`${cloudPath}/**`, cloudTask);
}

function handleError(err) {
    console.log('\n');
    log(colors.red('Error'));
    log('fileName: ' + colors.red(err.fileName));
    log('lineNumber: ' + colors.red(err.lineNumber));
    log('message: ' + err.massage);
    log('plugin: ' + colors.yellow(err.plugin));
}

function jsonTask() {
    return gulp
        .src(`${src}/**/*.json`)
        .pipe(isProd ? jsonminify() : through.obj())
        .pipe(gulp.dest(dist));
}

function wxmlTask() {
    return gulp.src(`${src}/**/*.wxml`).pipe(gulp.dest(dist));
}

function wxsTask() {
    return gulp.src(`${src}/**/*.wxs`).pipe(gulp.dest(dist));
}

function wxssTask() {
    const combined = combiner.obj([
        gulp.src(`${src}/**/*.{wxss,scss}`),
        sass().on('error', sass.logError),
        postcss([pxtorps(), base64()]),
        isProd ?
        cssnano({
            autoprefixer: false,
            discardComments: {
                removeAll: true
            }
        }) :
        through.obj(),
        rename((path) => (path.extname = '.wxss')),
        gulp.dest(dist)
    ]);
    combined.on('error', handleError);
    return combined;
}

function imgTask() {
    return gulp.src(`${src}/images/**`).pipe(gulp.dest(`${dist}/images`));
}

function jsTask() {
    const f = filter((file) => !/(mock|bluebird)/.test(file.path));
    return gulp
        .src(`${src}/**/*.js`)
        .pipe(isProd ? f : through.obj())
        .pipe(
            isProd ?
            jdists({
                trigger: 'prod'
            }) :
            jdists({
                trigger: 'dev'
            })
        )
        .pipe(
            isProd ?
            terser() :
            through.obj()
        )
        .pipe(isProd ? through.obj() : sourcemaps.write('./'))
        .pipe(gulp.dest(dist));
}

function watch() {
    ['wxml', 'wxss', 'js', 'json', 'wxs'].forEach((v) => {
        gulp.watch(`${src}/**/*.${v}`, global[`${v}Task`]);
    });
    gulp.watch(`${src}/images/**`, imgTask);
    gulp.watch(`${src}/**/*.scss`, wxssTask);
}

function clean() {
    return del(['./dist/**']);
}

exports.dev = gulp.series(clean, jsonTask, imgTask, wxmlTask, wxssTask, jsTask, wxsTask, cloudTask, watch);

exports.build = gulp.series(clean, jsonTask, imgTask, wxmlTask, wxssTask, jsTask, wxsTask, cloudTask);

exports.cloudDev = gulp.series(cloudTask, watchCloud);
