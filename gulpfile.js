const gulp = require('gulp');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const runSequence = require('run-sequence');
const Web3 = require('web3');
const web3Utils = require('web3-utils');
const watch = require('gulp-watch');

const DEX_BUILD_ENV = process.env.DEX_BUILD_ENV || 'development'

const HOMEBRIDGE_CONTRACT_NAME = 'HomeBridge';
const DEXCHAIN_CONTRACT_NAME = 'DEXChain';
const DATASTORE_CONTRACT_NAME = 'DataStore';
const ORDERBOOK_CONTRACT_NAME = 'Orderbook';
const FEE_CONTRACT_NAME = 'FeeContract';
const ORDERSDB_CONTRACT_NAME = 'OrdersDB';
const ORDERMATCH_CONTRACT_NAME = 'OrderMatchContract';

const GENERATED_CONFIG_FILE_NAME = 'contracts.g';
const NETWORKS_CONFIG_FILE_NAME = (DEX_BUILD_ENV == 'production') ? 'network.prod' : 'network';
const TOKENS_CONFIG_FILE_NAME = (DEX_BUILD_ENV == 'production') ? 'tokens.prod' : 'tokens';


function runCommand (command, args, opts, done) {
    const cmd = spawn(command, args, opts);
    cmd.stderr.pipe(process.stderr);
    cmd.stdout.pipe(process.stdout);
    cmd.on('close', (code, signal) => {
        done(code);
    });
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
    .reduce((e1, e2) => Object.assign(e1, e2), {});
}

gulp.task('clean-generated-abi', (done) => {
    runCommand('rm', ['-rf', '_abi'], {}, (status) => {
        if (status != 0) {
            done(status);
        }
        runCommand('mkdir', [
            '-p', 
            `_abi/${HOMEBRIDGE_CONTRACT_NAME}`, 
            `_abi/${DEXCHAIN_CONTRACT_NAME}`,
            `_abi/${ORDERBOOK_CONTRACT_NAME}`,
            `_abi/${ORDERMATCH_CONTRACT_NAME}`,
        ], {}, done);
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

gulp.task('clean-contracts', (done) => {
    fs.writeFileSync(getConfigFilePath(GENERATED_CONFIG_FILE_NAME), '{}');
    done();
})

gulp.task('clean', (done) => {
    runSequence(['clean-generated-abi', 'clean-tmp-files', 'clean-config-files', 'clean-contracts'], done);
});

gulp.task('generate-abi', async (done) => {
    const HomeBridgeABI = getABIPath(HOMEBRIDGE_CONTRACT_NAME);
    const DEXChainABI = getABIPath(DEXCHAIN_CONTRACT_NAME);
    const OrderbookABI = getABIPath(ORDERBOOK_CONTRACT_NAME);
    const OrderMatchABI = getABIPath(ORDERMATCH_CONTRACT_NAME);
    const DataStoreABI = getABIPath(DATASTORE_CONTRACT_NAME);
    const FeeContractABI = getABIPath(FEE_CONTRACT_NAME);

    // Generate .go files
    await generateABIWithJSON(HomeBridgeABI, HOMEBRIDGE_CONTRACT_NAME, `_abi/${HOMEBRIDGE_CONTRACT_NAME}/${HOMEBRIDGE_CONTRACT_NAME}.go`);
    await generateABIWithJSON(DEXChainABI, DEXCHAIN_CONTRACT_NAME, `_abi/${DEXCHAIN_CONTRACT_NAME}/${DEXCHAIN_CONTRACT_NAME}.go`);
    await generateABIWithJSON(OrderbookABI, ORDERBOOK_CONTRACT_NAME, `_abi/${ORDERBOOK_CONTRACT_NAME}/${ORDERBOOK_CONTRACT_NAME}.go`);
    await generateABIWithJSON(OrderMatchABI, ORDERMATCH_CONTRACT_NAME, `_abi/${ORDERMATCH_CONTRACT_NAME}/${ORDERMATCH_CONTRACT_NAME}.go`);

    // Copy abi json to public directory
    return gulp.src([HomeBridgeABI, DEXChainABI, OrderbookABI, DataStoreABI, FeeContractABI, OrderMatchABI])
        .pipe(gulp.dest(`web/public/abi`));
});

gulp.task('copy-config', (done) => {
    const configFile = getConfigFilePath(GENERATED_CONFIG_FILE_NAME);
    const networksFile = getConfigFilePath(NETWORKS_CONFIG_FILE_NAME);
    const tokensFile = getConfigFilePath(TOKENS_CONFIG_FILE_NAME);

    // copy to public directory
    return gulp.src([configFile, networksFile, tokensFile])
        .pipe(gulp.dest(`web/public`));
});

gulp.task('deploy-contracts', (done) => {
    runSequence('clean-contracts', 'compile-contracts', 'deploy-bridge-contracts', 'deploy-exchange-contracts', 'clean-generated-abi', 'generate-abi', 'copy-config', done);
});

gulp.task('compile-contracts', (done) => {
    let env = Object.create(process.env);
    env.DEX_DAPP_BUILD_DIR = path.resolve(process.cwd(), 'dapp/build');
    env.DEX_DAPP_SRC_DIR = path.resolve(process.cwd(), 'dapp/contracts');
    env.DEX_DAPP_LIB_DIR = path.resolve(process.cwd(), 'node_modules/openzeppelin-solidity');   
    return runCommand('sh', [
        'scripts/build-contracts.sh'
    ], {
        env
    }, done);
});

gulp.task('deploy-bridge-contracts', async (done) => {
    let networksConfig = JSON.parse(fs.readFileSync('configs/network.json'));

    let web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider(networksConfig.bridge.provider));
    let networkID = await web3.eth.net.getId()
    
    let source = fs.readFileSync('dapp/build/HomeBridge.json');
    let contracts = JSON.parse(source)['contracts'];

    let accounts = await getWeb3Accounts(web3);

    let from = accounts[0];
    let txOpts = { from };

    let HomeBridgeJSON = contracts['HomeBridge.sol:HomeBridge']; 
    let HomeBridgeABI = JSON.parse(HomeBridgeJSON.abi);

    try {
        let HomeBridge = await deployContract({
            web3,
            contractJSON: HomeBridgeJSON,
            args: [
                networksConfig.bridge.requiredSignatures,
                networksConfig.authorities
            ],
            txOpts
        });
        writeJSONFile(getABIPath(HOMEBRIDGE_CONTRACT_NAME), HomeBridgeABI);
        appendToConfigFile({
            bridge: {
                network: networkID,
                address: HomeBridge.options.address,
                topics: getAllTopicsFromABI(HomeBridgeABI)
            }
        })
        console.log(`HomeBridge deployed at ${HomeBridge.options.address}\n\n`);
    } catch (e) {
        console.error(e);
    }
});

gulp.task('deploy-exchange-contracts', async (done) => {
    let networksConfig = JSON.parse(fs.readFileSync('configs/network.json'));

    let web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider(networksConfig.exchange.provider));
    let networkID = await web3.eth.net.getId()

    let accounts = await getWeb3Accounts(web3);

    let from = accounts[0];
    let txOpts = { 
        from,
        gas: '3000000',
        gasPrice: 0
    };

    console.log(`\n\nDeploying DataStore...`)
    let DataStoreContractSource = JSON.parse(fs.readFileSync('dapp/build/DataStore.json'));
    let DataStoreJSON = DataStoreContractSource.contracts['DataStore.sol:DataStore']; 
    let DataStoreABI = JSON.parse(DataStoreJSON.abi);
    writeJSONFile(getABIPath(DATASTORE_CONTRACT_NAME), DataStoreABI);
    let DataStore = await deployContract({ web3, contractJSON: DataStoreJSON, txOpts});
    appendToConfigFile({
        datastore: {
            network: networkID,
            address: DataStore.options.address,
            topics: getAllTopicsFromABI(DataStoreABI)
        }
    })
    console.log(`DataStore deployed at ${DataStore.options.address}`);

    console.log(`\n\nDeploying DEXChain...`)
    let DEXChainContractSource = JSON.parse(fs.readFileSync('dapp/build/DEXChain.json'));
    let DEXChainJSON = DEXChainContractSource.contracts['DEXChain.sol:DEXChain']; 
    let DEXChainABI = JSON.parse(DEXChainJSON.abi);
    writeJSONFile(getABIPath(DEXCHAIN_CONTRACT_NAME), DEXChainABI);
    let DEXChain = await deployContract({
        web3, 
        contractJSON: DEXChainJSON, 
        args: [DataStore.options.address], 
        txOpts
    });
    appendToConfigFile({
        exchange: {
            network: networkID,
            address: DEXChain.options.address,
            topics: getAllTopicsFromABI(DEXChainABI)
        }
    })
    console.log(`DEXChain deployed at ${DEXChain.options.address}`);

    console.log(`\n\nDeploying FeeContract...`)
    let FeeContractContractSource = JSON.parse(fs.readFileSync('dapp/build/FeeContract.json'));
    let FeeContractJSON = FeeContractContractSource.contracts['FeeContract.sol:FeeContract']; 
    let FeeContractABI = JSON.parse(FeeContractJSON.abi);
    writeJSONFile(getABIPath(FEE_CONTRACT_NAME), FeeContractABI);
    let FeeContract = await deployContract({
        web3, 
        contractJSON: FeeContractJSON, 
        args: [DataStore.options.address], 
        txOpts
    });
    appendToConfigFile({
        feecontract: {
            network: networkID,
            address: FeeContract.options.address,
            topics: getAllTopicsFromABI(FeeContractABI)
        }
    })
    console.log(`FeeContract deployed at ${FeeContract.options.address}`);

    console.log(`\n\nDeploying OrdersDB...`)
    let OrdersDBContractSource = JSON.parse(fs.readFileSync('dapp/build/OrdersDB.json'));
    let OrdersDBJSON = OrdersDBContractSource.contracts['OrdersDB.sol:OrdersDB']; 
    let OrdersDBABI = JSON.parse(OrdersDBJSON.abi);
    writeJSONFile(getABIPath(ORDERSDB_CONTRACT_NAME), OrdersDBABI);
    let OrdersDB = await deployContract({
        web3, 
        contractJSON: OrdersDBJSON, 
        args: [DataStore.options.address], 
        txOpts
    });
    appendToConfigFile({
        ordersdb: {
            network: networkID,
            address: OrdersDB.options.address,
            topics: getAllTopicsFromABI(OrdersDBABI)
        }
    })
    console.log(`OrdersDB deployed at ${OrdersDB.options.address}`);
    
    console.log(`\n\nDeploying Orderbook...`)
    let OrderbookContractSource = JSON.parse(fs.readFileSync('dapp/build/Orderbook.json'));
    let OrderbookJSON = OrderbookContractSource.contracts['Orderbook.sol:Orderbook']; 
    let OrderbookABI = JSON.parse(OrderbookJSON.abi);
    writeJSONFile(getABIPath(ORDERBOOK_CONTRACT_NAME), OrderbookABI);
    let Orderbook = await deployContract({
        web3, 
        contractJSON: OrderbookJSON, 
        args: [OrdersDB.options.address, DEXChain.options.address, FeeContract.options.address], 
        txOpts
    });
    appendToConfigFile({
        orderbook: {
            network: networkID,
            address: Orderbook.options.address,
            topics: getAllTopicsFromABI(OrderbookABI)
        }
    })
    console.log(`Orderbook deployed at ${Orderbook.options.address}`);
    
    let OrderMatchContractContractSource = JSON.parse(fs.readFileSync('dapp/build/OrderMatchContract.json'));
    console.log(`\n\nDeploying OrderMatchContract...`)
    let OrderMatchContractJSON = OrderMatchContractContractSource.contracts['OrderMatchContract.sol:OrderMatchContract']; 
    let OrderMatchContractABI = JSON.parse(OrderMatchContractJSON.abi);
    writeJSONFile(getABIPath(ORDERMATCH_CONTRACT_NAME), OrderMatchContractABI);
    let OrderMatchContract = await deployContract({
        web3, 
        contractJSON: OrderMatchContractJSON, 
        args: [OrdersDB.options.address, DEXChain.options.address, FeeContract.options.address], 
        txOpts
    });
    appendToConfigFile({
        ordermatch: {
            network: networkID,
            address: OrderMatchContract.options.address,
            topics: getAllTopicsFromABI(OrderMatchContractABI)
        }
    })
    console.log(`OrderMatchContract deployed at ${OrderMatchContract.options.address}`);

    console.log("\n\n\nWhitelisting DEXChain contract for DataStore...")
    await DataStore.methods.whitelistContract(DEXChain.options.address).send(txOpts)
    .then(function () {
        console.log("Feeding Authorities to DEXChain...");
        return DEXChain.methods.setAuthorities(networksConfig.exchange.requiredSignatures, networksConfig.authorities).send(txOpts)
    })
    .then(function () {
        console.log("Whitelisting OrdersDB contract for DataStore...")
        return DataStore.methods.whitelistContract(OrdersDB.options.address).send(txOpts)
    })
    .then(function () {
        console.log("Whitelisting Orderbook contract for OrdersDB...")
        return OrdersDB.methods.whitelistContract(Orderbook.options.address).send(txOpts)
    })
    .then(function () {
        console.log("Whitelisting Orderbook contract for DEXChain...")
        return DEXChain.methods.whitelistContract(Orderbook.options.address).send(txOpts)
    })
    .then(function () {
        console.log("Whitelisting OrderMatchContract contract for OrdersDB...")
        return OrdersDB.methods.whitelistContract(OrderMatchContract.options.address).send(txOpts)
    })
    .then(function () {
        console.log("Whitelisting OrderMatchContract contract for DEXChain...")
        return DEXChain.methods.whitelistContract(OrderMatchContract.options.address).send(txOpts)
    })
    .then(function () {
        console.log("Whitelisting OrderMatcher address for OrderMatchContract...")
        return OrderMatchContract.methods.whitelistUser(networksConfig.orderMatcher).send(txOpts)
    })
    .then(function () {
        console.log("Whitelisting FeeContract contract for DataStore...")
        return DataStore.methods.whitelistContract(FeeContract.options.address).send(txOpts)
    })
    .then(function () {
        console.log("Feeding fee details to FeeContract...")
        return FeeContract.methods.updateFees(
            networksConfig.feeAccount,
            networksConfig.exchange.makeFee, 
            networksConfig.exchange.takeFee,
            networksConfig.exchange.cancelFee
        ).send(txOpts)
    })
    .catch(function (err) {
        console.error(err);
    })
});

gulp.task('build-go', (done) => {
    done();
});

gulp.task('default', (done) => {
    runSequence('clean', 'deploy-contracts', 'copy-config', 'generate-abi', 'build-go', done);
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

function delay(timeInMillis) {
    return new Promise((resolve, _) => {
        setTimeout(resolve, timeInMillis)
    })
}

function deployContract({ web3, contractJSON, args, txOpts, libraries }) {
    // ABI description as JSON structure
    let abi = JSON.parse(contractJSON.abi);

    // Smart contract EVM bytecode as hex
    let code = '0x' + contractJSON.bin;

    if (libraries) {
        for (let libName in libraries) {
            code = code.replace(new RegExp("_*" + libName + ".*_*", "g"), libraries[libName].slice(2));
        }
    }

    // Create Contract proxy class
    let MyContract = new web3.eth.Contract(abi);

    txOpts = Object.assign({}, {
        gas: '10000000',
        // gas: '5000000000000000',
        gasPrice: 0
    }, txOpts)

    return new Promise(function (resolve, reject) {
        MyContract.deploy({
            data: code,
            arguments: args
        })
        .send(txOpts, async function (err, transactionHash) {
            if (err) {
                reject(err)
                return
            }

            console.log("Got TxHash", transactionHash)

            let txReceipt

            let n = 0

            while (true) {
                n++
                console.log(`(${n}) Trying for receipt...`)
                r = await (new Promise(function (resolve, reject) {
                    web3.eth.getTransactionReceipt(transactionHash, function (err, receipt) {
                        if (err) {
                            reject(err)
                            return
                        }
                        resolve(receipt)
                    })
                }))
                if (r != null) {
                    txReceipt = r
                    break
                }
                await delay(500)
            }

            if (!txReceipt.status) {
                reject(new Error(`Transaction reverted by EVM`))
                return
            }

            console.log(`Deployed at ${txReceipt.contractAddress}.`)

            let contractInstance = new web3.eth.Contract(abi, txReceipt.contractAddress)
            resolve(contractInstance)
        })
        // .on('error', function (error) {
        //     reject(error);
        // })
        // .on('transactionHash', function (transactionHash) {
        //     console.log(`Got transaction hash: ${transactionHash}`);
        // })
        // .on('receipt', function (receipt) {
        //     console.log(`Deployed at ${receipt.contractAddress}. Waiting for confirmation...`);
        // })
        // .on('confirmation', function(confirmationNumber, receipt){
        //     console.log(`Contract creation confirmed...`);
        // })
        // .then(function (newContractInstance) {
        //     resolve(newContractInstance);
        // })
        // .catch(function (err) {
        //     reject(err);
        // });
    });
    
}

function appendToConfigFile(data) {
    let config = JSON.parse(fs.readFileSync(getConfigFilePath(GENERATED_CONFIG_FILE_NAME), 'utf8'));
    config = Object.assign({}, config, data);
    writeJSONFile(getConfigFilePath(GENERATED_CONFIG_FILE_NAME), config);
}