/******************************************************
* PATTERN LAB NODE
* EDITION-NODE-GULP
* The gulp wrapper around patternlab-node core, providing tasks to interact with the core library and move supporting frontend assets.
******************************************************/
var gulp = require('gulp');
var path = require('path');
var browserSync = require('browser-sync').create();
var argv = require('minimist')(process.argv.slice(2));

var projectConfig = require('./project.config.js');

//read all paths from our namespaced config file
var config = require('./patternlab-config');
var patternlab = require('patternlab-node');

var sgc = require('gulp-sass-generate-contents');
var sass  = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var gap = require('gulp-append-prepend');
var rename = require("gulp-rename");

var del = require('del');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

function resolvePath(pathInput) {
  return path.resolve(pathInput).replace(/\\/g,"/");
}

gulp.task('clean', function () {
	return del([
    projectConfig.dest.root,
    config.patternExportDirectory
  ]);
});

/******************************************************
* COPY TASKS - stream assets from source to destination
******************************************************/
// JS copy
gulp.task('pl-copy:js', function(){
  return gulp.src('**/*.js', {cwd: resolvePath(paths().source.js)} )
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(gulp.dest(resolvePath(projectConfig.dest.scripts)));
});

// Images copy
gulp.task('pl-copy:img', function(){
  return gulp.src('**/*.*',{cwd: resolvePath(paths().source.images)} )
    .pipe(gulp.dest(resolvePath(projectConfig.dest.images)));
});

// Favicon copy
gulp.task('pl-copy:favicon', function(){
  return gulp.src(paths().source.images + '/favicon.ico')
    .pipe(gulp.dest(resolvePath(projectConfig.dest.root)));
});

// Fonts copy
gulp.task('pl-copy:font', function(){
  return gulp.src('*', {cwd: resolvePath(paths().source.fonts)})
    .pipe(gulp.dest(resolvePath(projectConfig.dest.fonts)));
});

// Styleguide Copy everything but css
gulp.task('pl-copy:styleguide', function(){
  return gulp.src(resolvePath(paths().source.styleguide) + '/**/!(*.css)')
    .pipe(gulp.dest(resolvePath(paths().public.root)))
    .pipe(browserSync.stream());
});

// Styleguide Copy and flatten css
gulp.task('pl-copy:patternlab-css', function(){
  return gulp.src(resolvePath(paths().source.styleguide) + '/**/*.css')
    .pipe(gulp.dest(function(file){
      //flatten anything inside the styleguide into a single output dir per http://stackoverflow.com/a/34317320/1790362
      file.path = path.join(file.base, path.basename(file.path));
      return resolvePath(path.join(paths().public.styleguide, '/css'));
    }))
    .pipe(browserSync.stream());
});

// Styleguide Copy and flatten css
gulp.task('pl-copy:styleguide-css', function(){
  return gulp.src(resolvePath(paths().source.css))
    .pipe(gulp.dest(paths().public.root))
    .pipe(browserSync.stream());
});

/******************************************************
* Generate build HTML pages
******************************************************/

gulp.task('compile-homepage', function(done){
  return gulp.src('./pattern_exports/pages-homepage.html')
    .pipe(rename('index.html'))
    .pipe(gulp.dest(projectConfig.dest.root))
});

gulp.task('compile-html-pages', gulp.series('compile-homepage'));

/******************************************************
* PATTERN LAB CONFIGURATION - API with core library
******************************************************/
function paths() {
  return config.paths;
}

function getConfiguredCleanOption() {
  return config.cleanPublic;
}

function build(done) {
  var hbs = require('./node_modules/patternengine-node-handlebars/lib/engine_handlebars.js');
  var helpers = require('./handlebarsHelpers.js');

  Object.keys(helpers).forEach(function(helperName) {
    hbs.engine.registerHelper(helperName, helpers[helperName]);
  });

  patternlab(config).build(done, getConfiguredCleanOption());
}

gulp.task('sass-generate-contents', function () {
  return gulp.src(projectConfig.itcss)
    .pipe(sgc(projectConfig.src.sass , '', {forceComments: false }))
    .pipe(gulp.dest(projectConfig.src.styles));
});

gulp.task('sass',function () {
  var processors = [
    autoprefixer({
      browsers: 'last 1 version'
    })
  ];

  return gulp.src(projectConfig.src.styles + 'main.scss')
    .pipe(sass())
    .pipe(postcss(processors))
    .pipe(gulp.dest(projectConfig.dest.styles));
});

gulp.task('pl-assets', gulp.series(
  gulp.parallel(
    'pl-copy:js',
    'pl-copy:img',
    'pl-copy:favicon',
    'pl-copy:font',
    'pl-copy:styleguide',
    'pl-copy:styleguide-css',
    'pl-copy:patternlab-css'
  ),
  function(done){
    done();
  })
);

// gulp.task('patternlab:version', function (done) {
//   patternlab.version();
//   done();
// });
//
// gulp.task('patternlab:help', function (done) {
//   patternlab.help();
//   done();
// });
//
// gulp.task('patternlab:patternsonly', function (done) {
//   patternlab.patternsonly(done, getConfiguredCleanOption());
// });
//
// gulp.task('patternlab:liststarterkits', function (done) {
//   patternlab.liststarterkits();
//   done();
// });
//
// gulp.task('patternlab:loadstarterkit', function (done) {
//   patternlab.loadstarterkit(argv.kit, argv.clean);
//   done();
// });
//
// gulp.task('patternlab:installplugin', function (done) {
//   patternlab.installplugin(argv.plugin);
//   done();
// });

gulp.task('patternlab:build', gulp.series('clean', 'sass-generate-contents', 'sass', 'pl-assets', build, 'compile-html-pages', function(done){
  done();
}));


/******************************************************
* SERVER AND WATCH TASKS
******************************************************/

// watch task utility functions
function getSupportedTemplateExtensions() {
  var engines = require('./node_modules/patternlab-node/core/lib/pattern_engines');

  return engines.getSupportedFileExtensions();
}
function getTemplateWatches() {
  return getSupportedTemplateExtensions().map(function (dotExtension) {
    return resolvePath(paths().source.patterns) + '/**/*' + dotExtension;
  });
}

function reload() {
  browserSync.reload();
}

function reloadCSS() {
  browserSync.reload('*.css');
}

function watch() {
  gulp.watch(projectConfig.itcss, { awaitWriteFinish: true })
    .on('change', gulp.series('sass-generate-contents', 'sass', reloadCSS));

  gulp.watch(resolvePath(paths().source.styleguide) + '/**/*.*', { awaitWriteFinish: true })
    .on('change', gulp.series('pl-copy:styleguide', 'pl-copy:styleguide-css', 'pl-copy:patternlab-css', reloadCSS));

  var patternWatches = [
    resolvePath(paths().source.patterns) + '/**/*.json',
    resolvePath(paths().source.patterns) + '/**/*.md',
    resolvePath(paths().source.data) + '/*.json',
    resolvePath(paths().source.js) + '/*',
    resolvePath(paths().source.fonts) + '/*',
    resolvePath(paths().source.images) + '/*',
    resolvePath(paths().source.meta) + '/*',
    resolvePath(paths().source.annotations) + '/*'
  ].concat(getTemplateWatches());

  gulp.watch(patternWatches, { awaitWriteFinish: true }).on('change', gulp.series('patternlab:build', reload));
}

gulp.task('patternlab:connect', gulp.series(function(done) {
  browserSync.init({
    port: 8080,
    server: {
      baseDir: projectConfig.dest.root
    },
    snippetOptions: {
      // Ignore all HTML files within the templates folder
      blacklist: ['/index.html', '/', '/?*']
    },
    notify: {
      styles: [
        'display: none',
        'padding: 15px',
        'font-family: sans-serif',
        'position: fixed',
        'font-size: 1em',
        'z-index: 9999',
        'bottom: 0px',
        'right: 0px',
        'border-top-left-radius: 5px',
        'background-color: #1B2032',
        'opacity: 0.4',
        'margin: 0',
        'color: white',
        'text-align: center'
      ]
    }
  }, function(){
    done();
  });
}));

/******************************************************
* COMPOUND TASKS
******************************************************/
gulp.task('default', gulp.series('patternlab:build'));
gulp.task('patternlab:watch', gulp.series('patternlab:build', watch));
gulp.task('patternlab:serve', gulp.series('patternlab:build', 'patternlab:connect', watch));
