const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));

gulp.task('styles', () => {
  return gulp.src('./assets/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./assets/'));
});

gulp.task('default', gulp.series('styles'));

gulp.task('watch', () => {
  gulp.watch('./assets/*.scss', (done) => {
      gulp.series(['styles'])(done);
  });
});