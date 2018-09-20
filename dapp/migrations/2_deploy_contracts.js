const fs = require('fs');
const path = require('path');
// const configFileName = path.resolve('./../app.json');
const configFile = require(path.resolve('./../../configs/network.json'));

const Exchange = artifacts.require('./Exchange.sol');
const HomeBridge = artifacts.require('./HomeBridge.sol');

module.exports = function (deployer, network, accounts) {
    const requiredHomeSignatures = configFile.home.requiredSignatures;
    const requiredForiegnSignatures = configFile.foreign.requiredSignatures;
    const makeFee = configFile.foreign.makeFee;
    const takeFee = configFile.foreign.takeFee;
    const cancelFee = configFile.foreign.cancelFee;

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
