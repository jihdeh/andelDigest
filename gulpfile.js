var bower = require('gulp-bower'),
    concat = require('gulp-concat'),
    karma = require('karma').server,
    gulp = require('gulp'),
    jade = require('gulp-jade'),
    jshint = require('gulp-jshint'),
    less = require('gulp-less'),
    nodemon = require('gulp-nodemon'),
    path = require('path'),
    protractor = require('gulp-protractor').protractor,
    mocha = require('gulp-mocha'),
    exit = require('gulp-exit'),
    browserSync = require('browser-sync'),
    rimraf = require('gulp-rimraf');

var paths = {
  public: 'public/**',
  jade: 'app/**/*.jade',
  styles: 'app/styles/*.+(less|css)',
  scripts: ['app/**/*.js'],
  staticFiles: [
    '!app/**/*.+(less|css|js|jade)',
     'app/**/*.*'
  ]
};

gulp.task('jade', function() {
  gulp.src(paths.jade)
    .pipe(jade())
    .pipe(gulp.dest('./public/'));
});

gulp.task('less', function () {
  gulp.src(paths.styles)
    .pipe(less({
      paths: [ path.join(__dirname, 'styles') ]
    }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('browser-sync', ['nodemon'], function() {
  browserSync.init(null, {
    proxy: "http://localhost:1337",
        files: ["./public/**/*.*"],
        browser: "google chrome",
        port: 1338,
  });
});

gulp.task('static-files',function(){
  return gulp.src(paths.staticFiles)
    .pipe(gulp.dest('public/'));
});

gulp.task('lint', function () {
  gulp.src(['./app/**/*.js','./server.js','./lib/**/*.js','./config/**/*.js']).pipe(jshint())
  .pipe(jshint.reporter('default'));
});

gulp.task('nodemon', function () {
  nodemon({ script: 'server.js', ext: 'js', ignore: ['public/**','app/**','node_modules/**'] })
    .on('restart',['jade','less'], function () {
      console.log('>> node restart');
    });
});

gulp.task('del:scripts', function() {
  return gulp.src('./public/js/index.js', { read: false }) // much faster 
    .pipe(rimraf());
});

gulp.task('scripts', function() {
  gulp.src(paths.scripts)
    .pipe(concat('index.js'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('watch', function() {
  gulp.watch(paths.jade, ['jade']);
  gulp.watch(paths.styles, ['less']);
  gulp.watch(paths.scripts, ['del:scripts', 'scripts']);
});


gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('public/lib/'));
});

gulp.task('test:client', ['browserify'], function(done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('test:server', ['test:client'], function() {
  return gulp.src('test/server/**/*.js')
  .pipe(mocha({
    reporter: 'spec',
    timeout: 50000
  }))
  .pipe(exit());
});

gulp.task('test:e2e',function(cb) {
  gulp.src('test/e2e/**/*.js')
  .pipe(protractor({
    configFile: 'protractor.conf.js',
    args: ['--baseUrl', 'http://127.0.0.1:8000']
  }))
  .on('error', function(e) {
      console.log(e);
  })
  .on('end', cb);
});

gulp.task('build', ['bower', 'del:scripts', 'scripts', 'jade', 'less', 'static-files', 'browser-sync']);
gulp.task('heroku:build', ['bower', 'del:scripts', 'scripts', 'jade', 'less', 'static-files']);
gulp.task('production', ['nodemon','build']);
gulp.task('default', ['nodemon', 'build', 'watch']);
gulp.task('heroku:production', ['heroku:build']);
gulp.task('test', ['test:client','test:server']);