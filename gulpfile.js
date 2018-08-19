const gulp = require('gulp');
const exec = require('child_process').exec;

gulp.task('contracts-compile', function (done) {
    exec('cd dapp && truffle compile', function (err, stdout, stderr) {
        console.error(stderr);
        console.log(stdout);

        done(err);
    });
});

gulp.task('default', function (done) {
    //
});