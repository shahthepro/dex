const gulp = require('gulp');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const runSequence = require('run-sequence');
const web3Utils = require('web3-utils');
const watch = require('gulp-watch');

const HOMEBRIDGE_CONTRACT_NAME = 'HomeBridge';
const EXCHANGE_CONTRACT_NAME = 'Exchange';

const GENERATED_CONFIG_FILE_NAME = 'contracts.g';

const MAINNET_NETWORK_ID = 1;
const SIDECHAIN_NETWORK_ID = 6454;
const DEVELOPMENT_NETWORK_ID = 5777;

function runCommand (command, args, opts, done) {
    const cmd = spawn(command, args, opts);
    cmd.stderr.pipe(process.stderr);
    cmd.stdout.pipe(process.stdout);
    cmd.on('close', (code, signal) => {
        done(code);
    });
}

function readTruffleJSON (contractName) {
    const trufflePath = path.resolve(__dirname, `dapp/build/contracts/${contractName}.json`);
    return JSON.parse(fs.readFileSync(trufflePath, 'utf8'));
}

function writeJSONFile (outFile, data) {
    fs.writeFileSync(outFile, JSON.stringify(data), (err) => {
        if (err) {
            throw err;
        }
    });
}

function getABIPath (contractName) {
    return path.resolve(__dirname, `_tmp/${contractName}.json`);
}

function getConfigFilePath (configFileName) {
    return path.resolve(__dirname, `configs/${configFileName}.json`);
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

function getAllTopicsFromABI(abi) {
    return abi
    .filter(i => i.type == 'event')
    .map((event) => {
        return {
            [event.name]: web3Utils.keccak256(`${event.name}(${event.inputs.map(p => p.type).join(',')})`)
        }
    })
    .reduce((e1, e2) => Object.assign(e1, e2));
}

gulp.task('clean-generated-abi', (done) => {
    runCommand('rm', ['-rf', '_abi'], {}, (status) => {
        if (status != 0) {
            done(status);
        }
        runCommand('mkdir', ['-p', `_abi/${HOMEBRIDGE_CONTRACT_NAME}`, `_abi/${EXCHANGE_CONTRACT_NAME}`], {}, done);
    });
});

gulp.task('clean-tmp-files', (done) => {
    runCommand('rm', ['-rf', '_tmp'], {}, (status) => {
        if (status != 0) {
            done(status);
        }
        runCommand('mkdir', ['-p', '_tmp'], {}, done);
    });
});

gulp.task('clean-config-files', (done) => {
    runCommand('rm', ['-f', getConfigFilePath(GENERATED_CONFIG_FILE_NAME)], {}, done);
});

gulp.task('clean', (done) => {
    runSequence(['clean-generated-abi', 'clean-tmp-files', 'clean-config-files'], done);
});

gulp.task('contracts-compile', (done) => {
    runCommand('truffle', ['compile'], { cwd: 'dapp' }, done);
});

gulp.task('generate-abi', async (done) => {
    const HomeBridgeABI = getABIPath(HOMEBRIDGE_CONTRACT_NAME);
    const ExchangeABI = getABIPath(EXCHANGE_CONTRACT_NAME);

    // Generate .go files
    await generateABIWithJSON(HomeBridgeABI, HOMEBRIDGE_CONTRACT_NAME, `_abi/${HOMEBRIDGE_CONTRACT_NAME}/${HOMEBRIDGE_CONTRACT_NAME}.go`);
    await generateABIWithJSON(ExchangeABI, EXCHANGE_CONTRACT_NAME, `_abi/${EXCHANGE_CONTRACT_NAME}/${EXCHANGE_CONTRACT_NAME}.go`);

    // Copy abi json to public directory
    return gulp.src([HomeBridgeABI, ExchangeABI])
        .pipe(gulp.dest(`web/public/abi`));
});

gulp.task('deploy-home-network', (done) => {
    runCommand('truffle', ['deploy', '--network', 'home'], { cwd: 'dapp' }, done);
});

gulp.task('deploy-foreign-network', (done) => {
    runCommand('truffle', ['deploy', '--network', 'foreign'], { cwd: 'dapp' }, done);
});

gulp.task('deploy-private-network', (done) => {
    const NETWORK = process.env.GETH_NETWORK || 'privatenet';
    runCommand('truffle', ['deploy', '--reset', '--network', NETWORK], { cwd: 'dapp' }, done);
});

gulp.task('contracts-deploy', (done) => {
    if (process.env.NODE_ENV == 'production') {
        runSequence('deploy-home-network', 'deploy-foreign-network', done);
    } else {
        runSequence('deploy-private-network', done);
    }
});

gulp.task('generate-config', (done) => {
    const HomeBridge = readTruffleJSON(HOMEBRIDGE_CONTRACT_NAME);
    const Exchange = readTruffleJSON(EXCHANGE_CONTRACT_NAME);

    let mainnetID = MAINNET_NETWORK_ID;
    let xnetID = SIDECHAIN_NETWORK_ID;

    if (process.env.NODE_ENV == 'production') {
        mainnetID = MAINNET_NETWORK_ID;
        xnetID = SIDECHAIN_NETWORK_ID;
    } else if (process.env.GETH_NETWORK == null || process.env.GETH_NETWORK == 'privatenet') {
        mainnetID = SIDECHAIN_NETWORK_ID;
        xnetID = SIDECHAIN_NETWORK_ID;
    } else {
        mainnetID = DEVELOPMENT_NETWORK_ID;
        xnetID = DEVELOPMENT_NETWORK_ID;
    }

    const HomeBridgeAddress = HomeBridge.networks[mainnetID].address;
    const ExchangeAddress = HomeBridge.networks[xnetID].address;

    writeJSONFile(getABIPath(HOMEBRIDGE_CONTRACT_NAME), HomeBridge.abi);
    writeJSONFile(getABIPath(EXCHANGE_CONTRACT_NAME), Exchange.abi);

    const configFile = getConfigFilePath(GENERATED_CONFIG_FILE_NAME);

    writeJSONFile(configFile, {
        home: {
            network: mainnetID,
            address: HomeBridgeAddress,
            topics: getAllTopicsFromABI(HomeBridge.abi)
        },
        foreign: {
            network: xnetID,
            address: ExchangeAddress,
            topics: getAllTopicsFromABI(Exchange.abi)
        }
    });

    // copy to public directory
    return gulp.src([configFile])
        .pipe(gulp.dest(`web/public`));

});

gulp.task('build-go', (done) => {
    done();
});

gulp.task('default', (done) => {
    runSequence('clean', 'contracts-compile', 'contracts-deploy', 'generate-config', 'generate-abi', 'build-go', done);
});
