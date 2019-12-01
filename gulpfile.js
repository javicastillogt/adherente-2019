var gulp = require('gulp')
var autoprefixer = require('gulp-autoprefixer')
var clone = require('gulp-clone')
var concat = require('gulp-concat')
var fileinclude = require('gulp-file-include')
var minify = require('gulp-minify-css')
var prettify = require('gulp-prettify') // for html ./dist markup
var rename = require('gulp-rename')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var standard = require('gulp-standard')
var uglify = require('gulp-uglify')

var browserSync = require('browser-sync').create()
var reload = browserSync.reload

var es = require('event-stream');

const paths = {
  'scripts': ['assets/scripts/*.js'],
  'styles': ['assets/styles/**/*.scss'],
  'markup' : {
    'sections' : ['./sections/**/*'],
    'partials' : ['./partials/**/*']
  },
  'dist' : './dist'
}

//compila los vendors js en un solo archivo
gulp.task('vendors-js', function() {
  return gulp.src([
    // Include all the js vendor libraries
    './node_modules/material-design-lite/material.min.js',
    './node_modules/dialog-polyfill/dialog-polyfill.js',
    './node_modules/moment/min/moment.min.js'
    ])
  //.pipe(concat('vendor.js'))
  .pipe(gulp.dest( paths.dist + '/scripts' ))
})

//compila los vendors css en un solo archivo
gulp.task('vendors-css', function() {
  return gulp.src([
    // Include all the css external libraries
    //'./bower_components/material-design-lite/material.min.css'
    ])
  .pipe(concat('vendor.css'))
  .pipe(minify())
  .pipe(gulp.dest( paths.dist + '/styles' ))
})

//compila los vendors en un solo archivo (css y js)
gulp.task('vendors', ['vendors-css', 'vendors-js'])

//compila los js en un solo archivo
var scripts = function (event) {
  console.log('scripts: silence is golden')
  //var type = event.type
  var gulpath = event.path || paths.scripts

  var stream = gulp.src( gulpath )

  var uglified = stream.pipe(clone())
  .pipe(uglify().on('error', function(err){
    console.log('error fatal: ', err.fileName, 'line: ', err.lineNumber)
    }))
  .pipe(rename(function (file) {
    file.basename = file.basename + '.min'
    }))

  return es.merge(stream, uglified)
  .pipe( gulp.dest( paths.dist + '/scripts' ))
  .pipe(reload({stream:true}))
}
gulp.task('scripts', scripts)

var jsstandard = function (event) {
  console.log('js standard: silence is golden')
  var gulpath = event.path || paths.scripts

  return  gulp.src( gulpath )
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: false,
      quiet: false
    }))
}
gulp.task('standard', jsstandard);

//compila los sass en un solo archivo
var styles = function(event) {
  console.log('styles: silence is golden')
  // var gulpath = event.path || paths.styles
  var gulpath = 'assets/styles/**/*.scss'

  var stream =  gulp.src(gulpath)
  .pipe(sass.sync().on('error', sass.logError))
  .pipe( autoprefixer({browsers: ['last 2 versions']}) )

  var minified = stream.pipe(clone())
  .pipe(sourcemaps.init())
  .pipe(minify())
  .pipe(sourcemaps.write('../maps'))
  .pipe(rename(function (file) {
    file.basename = file.basename + '.min'
  }))

  return es.merge(stream, minified).pipe(gulp.dest(paths.dist + '/styles'))
  .pipe(browserSync.stream())
}

gulp.task('styles', styles)

var files = function (event) {
  console.log('files: silence is golden')
  //var gulpath = event.path || paths.markup.sections
  gulp.src(paths.markup.sections)
  .pipe(fileinclude({
    prefix: '@@',
    basepath: '@file'
    }))
  .pipe(gulp.dest(paths.dist))
  .pipe(prettify({indent_size: 2}))
  .pipe(reload({stream:true}))
}

gulp.task('files', files)

gulp.task('generate-service-worker', function(callback) {
  var path = require('path');
  var swPrecache = require('sw-precache');
  var rootDir = 'dist';

  swPrecache.write(`${rootDir}/service-worker.js`, {
    staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
    stripPrefix: rootDir
  }, callback);
});

gulp.task('serve', ['styles', 'scripts'], function() {

  browserSync.init({
    server: paths.dist
  })

  gulp.watch(paths.styles, styles)
  gulp.watch(paths.scripts, scripts)
  gulp.watch(paths.markup.sections, files)
  gulp.watch(paths.markup.partials, files)
})

gulp.task('build', ['vendors','styles', 'scripts', 'files'])

gulp.task('w.standard', function(){
  gulp.watch(paths.scripts).on('change', jsstandard)
})
