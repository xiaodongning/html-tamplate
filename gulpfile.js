var gulp = require('gulp');
var fileInclude = require('gulp-file-include');
var sass = require('gulp-sass'); // scss 插件
var browserSync = require('browser-sync'); // 浏览器自动刷新 插件
var useref = require('gulp-useref'); // 合并html中的文件 插件
var uglify = require('gulp-uglify'); // 压缩js 插件
var gulpIf = require('gulp-if');
var cleanCSS = require('gulp-clean-css'); // 压缩css 插件
var autoprefixer = require('gulp-autoprefixer');
var rev = require('gulp-rev'); // 添加版本号
var revReplace = require('gulp-rev-replace');
var del = require('del'); // 删除插件
var runSequence = require('run-sequence'); //同步任务
var imagemin = require('gulp-imagemin'); // 图片压缩
var tinypng = require('gulp-tinypng'); // 另一款图片压缩
var cache = require('gulp-cache');
var config = {
    prod: 'dist', // 打包后的文件夹名称
    root: 'src'  // 开发目录
}
var path = {
    html: 'src/*.html',
    page: 'src/page/*.html',
    js: 'src/js/**/*.js',
    css: 'src/css/**/*.css',
    img: 'src/img/**/*',
    scss: 'src/scss/**/*.scss'
}

// 增加浏览器前缀配置
var preConfig = {
    browsers: ['last 2 versions', 'Android >= 4.0'] // 控制增加前缀的版本
  }
/**
    *.scss：*号匹配当前目录任意文件，所以这里*.scss匹配当前目录下所有scss文件
    **.scss：匹配当前目录及其子目录下的所有scss文件。
    !not-me.scss：！号移除匹配的文件，这里将移除not-me.scss
    *.+(scss|sass)：+号后面会跟着圆括号，里面的元素用|分割，匹配多个选项。这里将匹配scss和sass
 */
gulp.task('sass', function () {
    return gulp.src(path.scss)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(preConfig))
        .pipe(gulp.dest('src/css'))
        .pipe(browserSync.reload({
        stream: true
        }))
})
// html include 可让代码复用
gulp.task('fileInclude', function() {
    return gulp.src(path.page)
      .pipe(fileInclude({
        prefix: '@@',
        basepath: 'src/page/'
      }))
      .pipe(gulp.dest('./src/'));
});
var condition = function (file) {
  var fileArr = ['js/app.js'];
  console.log(file)
  if (fileArr.includes(file)) {
    return true;
  } else {
    return false;
  }

}
// 合并压缩js css 并复制到目录下
gulp.task('useref', function(){
    return gulp.src(path.html)
      .pipe(useref())
      .pipe(gulpIf('*.css', autoprefixer(preConfig)))
      .pipe(gulpIf('*.css', cleanCSS()))
      .pipe(gulpIf('*.css', rev()))
      .pipe(gulpIf('*.js', uglify()))
      .pipe(gulpIf(['js/app.js','js/main.js'], rev())) // 需要加版本号的文件 '*.js'
      .pipe(revReplace())
      .pipe(gulp.dest(config.prod))
})
// Optimizing Images
gulp.task('images', function() {
  return gulp.src(path.img+'.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
    .pipe(cache(imagemin({
      interlaced: true,
    })))
    .pipe(gulp.dest('dist/img'))
});
gulp.task('tinypng', function () {
  gulp.src(path.img + '.+(png|jpg|jpeg)')
		.pipe(cache(tinypng('API_KEY'))) // 配置tinypng key
		.pipe(gulp.dest('dist/img'));
});
// Copying img
gulp.task('img', function() {
    return gulp.src(path.img)
      .pipe(gulp.dest('dist/img'))
  })
// 删除dist目录不包括image
gulp.task('clean:dist', function(){
    return del.sync(['dist/**/*', '!dist/img', '!dist/img/**/*']);
})
// 删除dist
gulp.task('clean', function() {
    return del.sync('dist')
})
//实时自动刷新浏览器
gulp.task('browserSync', function() {
    browserSync({
      server: {
        baseDir: config.root
      },
    })
})

// gulp.task('watch', function(){
//     gulp.watch(path.scss, ['sass']);
//     // Other watchers
// })
gulp.task('watch', function (){
    gulp.watch(path.scss, ['sass']);
    gulp.watch(path.page, ['fileInclude']); //监听page目录变化执行 fileInclude任务
    // Reloads the browser whenever HTML or JS files change
    gulp.watch(path.html, browserSync.reload);
    gulp.watch(path.js, browserSync.reload);
});

// 打包
gulp.task('build', function (callback) {
    runSequence(
        'clean',
        'sass',
        'fileInclude', // html 复用任务，不需要可去掉
        ['useref','tinypng'],
        callback
    )
})
// 开发
/**
 * fileIncludew是html复用任务，不需要可去掉
 */
gulp.task('default', function (callback) {
    runSequence(['sass','fileInclude','browserSync'], 'watch',
      callback
    )
})
