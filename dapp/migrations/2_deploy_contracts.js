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
            // .then(function () {
            //     return deployer.deploy(UserWallet);
            // })
            // .then(function () {
            //     return deployer.link(UserWallet, Orderbook);
            // })
            // .then(function () {
            //     return deployer.deploy(Orderbook); // , { gas: "4999999999999999" }
            // })
            // .then(function () {
            //     return deployer.link(UserWallet, Exchange);
            // })
            // .then(function () {
            //     return deployer.link(Orderbook, Exchange);
            // })
            // .then(function () {
            //     return deployer.deploy(Exchange, requiredForiegnSignatures, a, DataStore.address, makeFee, takeFee, cancelFee);
            // })
            .then(function () {
                return deployer.deploy(Orderbook, DataStore.address);
            })
            // .then(function () {
            //     return Orderbook.deployed()
            // })
            // .then(function (instance) {
            //     return instance.whitelistContract.sendTransaction(Orderbook.address);
            // })
            // .then(function () {
            //     return DataStore.deployed()
            // })
            // .then(function (instance) {
            //     console.log(DataStore.address, Orderbook.address)
            //     return instance.whitelistContract.call(Orderbook.address);
            // })
            // // .then(function () {
            // //     return Orderbook.deployed()
            // // })
            // // .then(function (instance) {
            // //     return instance.setFeeAccount.sendTransaction(accounts[1], { from: accounts[0] });
            // // })
            // // .then(function () {
            // //     return Orderbook.deployed()
            // // })
            // // .then(function (instance) {
            // //     return instance.getFeeAccount.call();
            // // })
            // .then(function (resp) {
            //     console.log("RESP", resp)
            //     return DataStore.deployed()
            // })
            // .then(function (instance) {
            //     return instance.allowedContracts.call(Orderbook.address);
            // })
            // .then(function (resp) {
            //     console.log("RESP", resp)
            // })
            // // .then(function (datastoreInstance) {
            // //     return datastoreInstance.whitelistContract.sendTransaction(DataStore.address);
            // // })
            // // .then(function () {
            // //     return DataStore.deployed();
            // // })
            // // .then(function (datastoreInstance) {
            // //     return datastoreInstance.isContractAllowed.call(DataStore.address);
            // // })
            // // .then(function (op) {
            // //     console.log("OP", op);
            // // })
            // // .then(function () {
            // //     return deployer.deploy(HomeBridge, requiredHomeSignatures, a);
            // // });
            
            break;
    }
};
