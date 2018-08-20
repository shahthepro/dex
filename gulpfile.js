const gulp = require('gulp');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const runSequence = require('run-sequence');

function runCommand (command, args, opts, done) {
    const cmd = spawn(command, args, opts);
    cmd.stderr.pipe(process.stderr);
    cmd.stdout.pipe(process.stdout);
    cmd.on('close', (code, signal) => {
        done(code);
    });
}

function extractABIFromTruffleJSON (contractName) {
    const trufflePath = path.resolve(__dirname, `dapp/build/contracts/${contractName}.json`);
    const outFile = path.resolve(__dirname, `.dist/temp_${Date.now()}_${contractName}.json`)
    const abiData = JSON.parse(fs.readFileSync(trufflePath, 'utf8')).abi;
    fs.writeFileSync(outFile, JSON.stringify(abiData), (err) => {
        if (err) {
            throw err;
        }
    });
    return outFile;
}

function generateABIWithJSON (abi, pkg, out) {
    return new Promise((resolve, reject) => {
        runCommand('abigen', [
            `--abi=${abi}`,
            `--pkg=${pkg}`,
            `--out=${out}`
        ], {}, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve(error);
            }
        })
    });
}

gulp.task('contracts-compile', (done) => {
    runCommand('truffle', ['compile'], { cwd: 'dapp' }, done);
});

gulp.task('generate-abi', (done) => {
    const HomeBridgeABI = extractABIFromTruffleJSON('HomeBridge');
    const ExchangeABI = extractABIFromTruffleJSON('Exchange');

    Promise.all([
        generateABIWithJSON(HomeBridgeABI, 'HomeBridge', '_abi/HomeBridge/HomeBridge.go'),
        generateABIWithJSON(ExchangeABI, 'Exchange', '_abi/Exchange/Exchange.go')
    ])
    .then(() => { done(); });
});

gulp.task('deploy-home-network', (done) => {
    runCommand('truffle', ['deploy', '--network', 'home'], {}, done);
});

gulp.task('deploy-foreign-network', (done) => {
    runCommand('truffle', ['deploy', '--network', 'foreign'], {}, done);
});

gulp.task('deploy-private-network', (done) => {
    runCommand('truffle', ['deploy', '--reset', '--network', 'privatenet'], {}, done);
});

gulp.task('contracts-deploy', (done) => {
    if (process.env.NODE_ENV == 'production') {
        runSequence('deploy-home-network', 'deploy-foreign-network', done);
    } else {
        runSequence('deploy-private-network', done);
    }
});

gulp.task('build-go', (done) => {
    done();
});

gulp.task('default', (done) => {
    runSequence('contracts-compile', 'generate-abi', 'contracts-deploy', 'build-go');
});