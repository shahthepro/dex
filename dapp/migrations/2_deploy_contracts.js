const fs = require('fs');
const path = require('path');
// const configFileName = path.resolve('./../app.json');
const configFile = require(path.resolve('./../../configs/network.json'));

const Exchange = artifacts.require('./Exchange.sol');
const HomeBridge = artifacts.require('./HomeBridge.sol');

module.exports = function (deployer, network, accounts) {
    let a = configFile.authorities;

    switch (network) {
        case 'development':
            a = [accounts[6], accounts[7], accounts[8]];

        case 'privatenet':
            deployer.deploy(Exchange, 3, a)
                // .then(() => {
                //     configFile.foreign.contract = Exchange.address;
                // });
            
            deployer.deploy(HomeBridge, 3, a)
                // .then(() => {
                //     configFile.home.contract = HomeBridge.address;
                // });
            break;
    }
};
