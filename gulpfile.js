var gulp = require('gulp');
var include = require('gulp-include');

gulp.task('build', function () {
	gulp.src('./src/main.js')
		.pipe(include())
		.pipe(gulp.dest('./dist/'));
});

gulp.task('watch', ['build'], function () {
	gulp.watch('./src/**/*.js', ['build']);
});