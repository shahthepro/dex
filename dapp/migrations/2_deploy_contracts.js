const fs = require('fs');
const path = require('path');
// const configFileName = path.resolve('./../app.json');
const configFile = require(path.resolve('./../../configs/network.json'));

const Exchange = artifacts.require('./Exchange.sol');
const HomeBridge = artifacts.require('./HomeBridge.sol');

module.exports = function (deployer, network, accounts) {
    const requiredHomeSignatures = configFile.bridge.requiredSignatures;
    const requiredForiegnSignatures = configFile.exchange.requiredSignatures;
    const makeFee = configFile.exchange.makeFee;
    const takeFee = configFile.exchange.takeFee;
    const cancelFee = configFile.exchange.cancelFee;

    let a = configFile.authorities;

    switch (network) {
        case 'development':
            a = [accounts[5], accounts[6], accounts[7], accounts[8]];

        case 'privatenet':
            deployer.deploy(HomeBridge, requiredForiegnSignatures, a);
            deployer.deploy(Exchange, requiredHomeSignatures, a, makeFee, takeFee, cancelFee);
            break;
    }
};
