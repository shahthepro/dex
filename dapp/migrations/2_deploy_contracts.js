const fs = require('fs');
const path = require('path');
// const configFileName = path.resolve('./../app.json');
const configFile = require(path.resolve('./../../configs/network.json'));

const Exchange = artifacts.require('./Exchange.sol');
const HomeBridge = artifacts.require('./HomeBridge.sol');
const DataStore = artifacts.require('./core/DataStore.sol');
const Orderbook = artifacts.require('./core/Orderbook.sol');
const UserWallet = artifacts.require('./core/UserWallet.sol');

module.exports = function (deployer, network, accounts) {
    const requiredHomeSignatures = configFile.bridge.requiredSignatures;
    const requiredForiegnSignatures = configFile.exchange.requiredSignatures;
    const makeFee = configFile.exchange.makeFee;
    const takeFee = configFile.exchange.takeFee;
    const cancelFee = configFile.exchange.cancelFee;

    let a = configFile.authorities;

    let instance;

    switch (network) {
        case 'development':
            a = [accounts[5], accounts[6], accounts[7], accounts[8]];

        case 'privatenet':
        case 'paritynet':
            deployer.deploy(DataStore)
            .then(function () {
                return deployer.deploy(UserWallet);
            })
            .then(function () {
                return deployer.link(UserWallet, Orderbook);
            })
            .then(function () {
                return deployer.deploy(Orderbook); // , { gas: "4999999999999999" }
            })
            .then(function () {
                return deployer.link(UserWallet, Exchange);
            })
            .then(function () {
                return deployer.link(Orderbook, Exchange);
            })
            .then(function () {
                return deployer.deploy(Exchange, requiredForiegnSignatures, a, DataStore.address, makeFee, takeFee, cancelFee);
            })
            .then(function () {
                return DataStore.deployed();
            })
            .then(function (datastoreInstance) {
                return datastoreInstance.addExchangeContract.sendTransaction(Exchange.address);
            })
            .then(function () {
                return deployer.deploy(HomeBridge, requiredHomeSignatures, a);
            });
            

        // try {
        //     await deployer.deploy(DataStore);
            
        //     await deployer.deploy(UserWallet);
        //     await deployer.link(UserWallet, Orderbook);
        //     await deployer.deploy(Orderbook);
        //     await deployer.link(UserWallet, Exchange);
        //     await deployer.link(Orderbook, Exchange);

        //     await deployer.deploy(Exchange, requiredForiegnSignatures, a, DataStore.address, makeFee, takeFee, cancelFee);
            
        //     // Whitelist exchange
        //     instance = await DataStore.deployed();
        //     await instance.addExchangeContract.sendTransaction(Exchange.address);
            
        //     await deployer.deploy(HomeBridge, requiredHomeSignatures, a);

            
        // } catch (e) {
        //     console.error(e)
        //     throw e
        // }
            break;
    }
};
