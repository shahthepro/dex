const gulp = require('gulp');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const runSequence = require('run-sequence');
const Web3 = require('web3');
const web3Utils = require('web3-utils');
const watch = require('gulp-watch');

const HOMEBRIDGE_CONTRACT_NAME = 'HomeBridge';
const EXCHANGE_CONTRACT_NAME = 'Exchange';

const GENERATED_CONFIG_FILE_NAME = 'contracts.g';
const NETWORKS_CONFIG_FILE_NAME = 'network';
const TOKENS_CONFIG_FILE_NAME = 'tokens';

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

gulp.task('deploy-contracts', (done) => {
    runSequence('')
});

gulp.task('truffle-contracts-compile', (done) => {
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

gulp.task('truffle-deploy-bridge-network', (done) => {
    runCommand('truffle', ['deploy', '--network', 'home'], { cwd: 'dapp' }, done);
});

gulp.task('truffle-deploy-exchange-network', (done) => {
    runCommand('truffle', ['deploy', '--network', 'exchange'], { cwd: 'dapp' }, done);
});

gulp.task('deploy-contracts', (done) => {
    runSequence('compile-contracts', 'deploy-bridge-contracts', 'deploy-exchange-contracts', done);
});

gulp.task('compile-contracts', (done) => {
    let env = Object.create(process.env);
    env.DEX_DAPP_BUILD_DIR = path.resolve(process.cwd(), 'dapp/build');
    env.DEX_DAPP_SRC_DIR = path.resolve(process.cwd(), 'dapp/contracts');
    env.DEX_DAPP_LIB_DIR = path.resolve(process.cwd(), 'node_modules/openzeppelin-solidity')
    env.DEX_DAPP_LIB_DEST_DIR = path.resolve(process.cwd(), 'dapp/contracts/openzeppelin-solidity');
    // env.DEX_DAPP_LIB_PATH = path.resolve(process.cwd(), 'node_modules/openzeppelin-solidity')
    return runCommand('sh', [
        'scripts/build-contracts.sh'
    ], {
        env
    }, done);
});

gulp.task('deploy-bridge-contracts', async (done) => {
    let web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8501'));
    
    let source = fs.readFileSync('dapp/build/HomeBridge.json');
    let contracts = JSON.parse(source)['contracts'];

    let networksConfig = JSON.parse(fs.readFileSync('configs/network.json'));

    let accounts = await getWeb3Accounts(web3);

    let from = accounts[0];
    let opts = { from };

    try {
        let HomeBridge = await deployContract(web3, contracts['HomeBridge.sol:HomeBridge'], [
            networksConfig.bridge.requiredSignatures,
            networksConfig.authorities
        ], opts);
        console.log(`HomeBridge deployed at ${HomeBridge.options.address}`);
    } catch (e) {
        console.error(e);
    }
});

gulp.task('deploy-exchange-contracts', async (done) => {
    let networksConfig = JSON.parse(fs.readFileSync('configs/network.json'));

    let web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider(networksConfig.exchange.provider));
    
    let source = fs.readFileSync('dapp/build/DEXChain.json');
    let contracts = JSON.parse(source)['contracts'];

    let accounts = await getWeb3Accounts(web3);

    let from = accounts[0];
    let opts = { from };

    let DataStore = await deployContract(web3, contracts['core/DataStore.sol:DataStore'], [], opts);
    console.log(`DataStore deployed at ${DataStore.options.address}`);

    let DEXChain = await deployContract(web3, contracts['DEXChain.sol:DEXChain'], [], opts);
    console.log(`DEXChain deployed at ${DEXChain.options.address}`);

    console.log("Whitelisting DEXChain contract...")
    DataStore.methods.whitelistContract(DEXChain.options.address).send(opts)
    .then(function (r) {
        console.log("Feeding DataStore address to DEXChain...");
        return DEXChain.methods.setDataStore(DataStore.options.address).send(opts)
    })
    .then(function (r) {
        console.log("Feeding Authorities to DEXChain...");
        return DEXChain.methods.setAuthorities(networksConfig.exchange.requiredSignatures, networksConfig.authorities).send(opts)
    })
    // .then(function (r) {
    //     return DEXChain.methods.setFeeAccount(accounts[1]).send(opts)
    // })
    // .then(function (r) {
    //     return DEXChain.methods.getFeeAccount().call(opts)
    // })
    // .then(function (test) {
    //     console.log("FINALLY", test)
    // })
    .catch(function (err) {
        console.error(err);
    })
});

gulp.task('truffle-deploy-private-network', async (done) => {
    const NETWORK = process.env.GETH_NETWORK || 'privatenet';
    runCommand('truffle', ['deploy', '--reset', '--all', '--network', NETWORK], { cwd: 'dapp' }, done);
});

gulp.task('truffle-contracts-deploy', (done) => {
    if (process.env.NODE_ENV == 'production') {
        runSequence('truffle-deploy-bridge-network', 'truffle-deploy-exchange-network', done);
    } else {
        runSequence('truffle-deploy-private-network', done);
    }
});

gulp.task('truffle-generate-config', (done) => {
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
    const ExchangeAddress = Exchange.networks[xnetID].address;

    writeJSONFile(getABIPath(HOMEBRIDGE_CONTRACT_NAME), HomeBridge.abi);
    writeJSONFile(getABIPath(EXCHANGE_CONTRACT_NAME), Exchange.abi);

    const configFile = getConfigFilePath(GENERATED_CONFIG_FILE_NAME);
    const networksFile = getConfigFilePath(NETWORKS_CONFIG_FILE_NAME);
    const tokensFile = getConfigFilePath(TOKENS_CONFIG_FILE_NAME);

    writeJSONFile(configFile, {
        bridge: {
            network: mainnetID,
            address: HomeBridgeAddress,
            topics: getAllTopicsFromABI(HomeBridge.abi)
        },
        exchange: {
            network: xnetID,
            address: ExchangeAddress,
            topics: getAllTopicsFromABI(Exchange.abi)
        }
    });

    // copy to public directory
    return gulp.src([configFile, networksFile, tokensFile])
        .pipe(gulp.dest(`web/public`));

});

gulp.task('build-go', (done) => {
    done();
});

gulp.task('default', (done) => {
    runSequence('clean', 'truffle-contracts-compile', 'truffle-contracts-deploy', 'truffle-generate-config', 'generate-abi', 'build-go', done);
    // runSequence('clean', 'deploy-contracts', 'generate-abi', 'build-go', done);
});

function getWeb3Accounts(web3) {
    return new Promise(function (resolve, reject) {
        web3.eth.getAccounts(function (err, accounts) {
            if (err) {
                reject(accounts);
                return;
            }

            resolve(accounts);
        });
    });
}
function deployContract(web3, contractJSON, args, opts) {
    // ABI description as JSON structure
    let abi = JSON.parse(contractJSON.abi);

    // Smart contract EVM bytecode as hex
    let code = '0x' + contractJSON.bin;

    // Create Contract proxy class
    let MyContract = new web3.eth.Contract(abi);

    opts = Object.assign({}, {
        // gas: '100000000000000',
        // gas: '18446744073709551',
        gas: '5000000000000000',
        gasPrice: 1
    }, opts)

    return new Promise(function (resolve, reject) {
        MyContract.deploy({
            data: code,
            arguments: args
        })
        // .estimateGas({
        //     from: accounts[0],
        //     gas: '18446744073709551615',
        //     gasPrice: '1'
        // })
        .send(opts)
        .on('error', function (error) {
            reject(error);
        })
        .on('transactionHash', function (transactionHash) {
            console.log(`Got transaction hash: ${transactionHash}`);
        })
        .on('receipt', function (receipt) {
            console.log(`Deployed at ${receipt.contractAddress}. Waiting for confirmation...`);
        })
        // .on('confirmation', function(confirmationNumber, receipt){
        //     console.log(`Contract creation confirmed...`);
        // })
        .then(function (newContractInstance) {
            resolve(newContractInstance);
        })
        .catch(function (err) {
            reject(err);
        });
    });
    
}

function whitelistExchangeContract(DataStore, Exchange, opts) {
    return new Promise(function (resolve, reject) {
        DataStore.methods
            .addExchangeContract(Exchange.options.address)
            .send(opts)
            .on('error', function (error) {
                reject(error);
            })
            .on('transactionHash', function (transactionHash) {
                // console.log(`Got transaction hash: ${transactionHash}`);
            })
            .on('receipt', function (receipt) {
                console.log(`Whitelisting ${Exchange.options.address}, Waiting for confirmation...`);
            })
            .then(function () {
                console.log(`Whitelisted ${Exchange.options.address}.`);
                resolve();
            })
            .catch(function (err) {
                reject(err);
            });
    })
}

// function runContractMethod(method, args, opts) {
//     return new Promise(function (resolve, reject) {
//         method(...args).send(opts, function (err, transactionHash) {});
//     })
// }

function initExchangeContract(Exchange, args, opts) {
    return new Promise(function (resolve, reject) {
        console.log("Updating DataStore contract address...");
        Exchange.methods.setDataStore(args[2]).send(opts)
        .then(function () {
            console.log("Updating Authorities...");
            return Exchange.methods.changeAuthorities(args[0], args[1]).send({
                ...opts,
                gas: '1000000000'
            });
        })
        .then(function () {
            console.log("Updating fee account...");
            return Exchange.methods.changeFeeAccount(opts.from).send({
                ...opts,
                gas: '1000000000'
            });
        })
        .then(function () {
            console.log("Updating make fee...");
            return Exchange.methods.changeMakeFee(args[3]).send({
                ...opts,
                gas: '1000000000'
            });
            // return Exchange.methods.changeFees(args[3], args[4], args[5]).send({
                //     ...opts,
                //     gas: '1000000'
                // });
        })
        .then(function () {
            console.log("Updating take fee...");
                
            return Exchange.methods.changeTakeFee(args[4]).send({
                ...opts,
                gas: '1000000000'
            });
        })
        .then(function () {
            console.log("Updating cancel fee...");
                
            return Exchange.methods.changeCancelFee(args[5]).send({
                ...opts,
                gas: '1000000000'
            });
        })
        .then(function () {
            resolve();
        })
        .catch(function (err) {
            reject(err);
        });
        // Exchange.methods
        //     .initiateExchangeContract(...args)
        //     .send(opts)
        //     .on('error', function (error) {
        //         reject(error);
        //     })
        //     .on('transactionHash', function (transactionHash) {
        //         // console.log(`Got transaction hash: ${transactionHash}`);
        //     })
        //     .on('receipt', function (receipt) {
        //         console.log(`Initiating exchange at ${Exchange.options.address}, Waiting for confirmation...`);
        //     })
        //     .then(function () {
        //         console.log(`Exchange available at ${Exchange.options.address}.`);
        //         resolve();
        //     })
        //     .catch(function (err) {
        //         reject(err);
        //     });
    });
}