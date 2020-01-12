const gulp         = require("gulp");
const del          = require("del");
const tap          = require("gulp-tap");
const sass         = require("gulp-sass");
const sourcemaps   = require("gulp-sourcemaps");
const csso         = require("gulp-csso");
const imagemin     = require("gulp-imagemin");
const concat       = require("gulp-concat");
const browserSync  = require("browser-sync").create();
const htmlhint     = require("gulp-htmlhint");
const postcss      = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const hashsrc      = require("gulp-hash-src");
const gulpif       = require('gulp-if');
const argv         = require('yargs').argv;
const svgstore     = require('gulp-svgstore');
const inject       = require('gulp-inject');
const base64       = require('gulp-base64-inline');
const path         = require("path");

gulp.task("clean", function(){
    return del("build");
});

gulp.task("html", function(){
    let path = "src";
    return gulp.src("src/*.html")
        .pipe(tap((file) => path = file.path))
        .pipe(gulp.dest("build"))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task("style", function () {
    return gulp.src("src/scss/main.scss")
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(csso())
        .pipe(postcss([autoprefixer()]))
        .pipe(gulpif(!argv.production, sourcemaps.write()))
        .pipe(gulp.dest("build/css"))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task("images", function(){
    return gulp.src(["src/images/**/*.{jpeg,jpg,png,svg,gif}"], {since: gulp.lastRun("images")})
        .pipe(imagemin())
        .pipe(gulp.dest("build/images"))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task("js", function() {
    return gulp.src("src/**/*.js")
        .pipe(sourcemaps.init())
        .pipe(concat("main.min.js"))
        .pipe(gulpif(!argv.production, sourcemaps.write()))
        .pipe(gulp.dest("build/js"))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task("watch", function() {
    gulp.watch("src/**/*.html", gulp.series("html", browserSync.reload));
    gulp.watch("src/images/**/*.*",  gulp.series("svgstore", "images"));
    gulp.watch("src/**/*.scss",  gulp.series("style", "inline-base64-images"));
    gulp.watch("src/**/*.js",  gulp.series("js"));
});

gulp.task("serve", function () {
    browserSync.init({
        server: {
            baseDir: "build"
        },
    });

    gulp.watch("src/**/*.html", gulp.series("html"));
    gulp.watch("src/images/**/*.*", gulp.series("images", "svgstore"));
    gulp.watch("src/**/*.scss", gulp.series("style", "inline-base64-images"));
    gulp.watch("src/**/*.js", gulp.series("js"));
})

gulp.task("html:validator", function(){
    return gulp.src("src/*.html")
        .pipe(htmlhint())
        .pipe(htmlhint.failOnError())
});

gulp.task("hashfiles", function () {
    return gulp.src("build/**/*.html")
        .pipe(hashsrc({build_dir:"build",src_path:"js",exts:[".js"], hash_len: 10}))
        .pipe(hashsrc({build_dir:"build",src_path:"css",exts:[".css"], hash_len: 10}))
        .pipe(gulp.dest("build"));
});

gulp.task('svgstore', function () {
    let svgs = gulp
        .src('src/images/*.svg', {since: gulp.lastRun("svgstore")})
        .pipe(svgstore({ inlineSvg: true }));

    function fileContents (filePath, file) {
        console.log(file.contents.toString())
        return file.contents.toString();
    }

    return gulp
        .src('src/**/*.html')
        .pipe(inject(svgs, { transform: fileContents }))
        .pipe(gulp.dest('src'));
});

gulp.task('inline-base64-images', function () {
    return gulp.src('./build/css/main.css')
        .pipe(base64('../images'))
        .pipe(gulp.dest('./build/css'));
});

gulp.task('fonts', function() {
    return gulp.src("src/fonts/*.woff")
        .pipe(gulp.dest("build/fonts"))
});

gulp.task("dev", gulp.series("clean", "svgstore", "html", "images",  "style", "fonts", "inline-base64-images", "js", "serve"));
gulp.task("prod", gulp.series("clean", "svgstore", "html", "images", "style", "fonts", "inline-base64-images", "js", "hashfiles"));