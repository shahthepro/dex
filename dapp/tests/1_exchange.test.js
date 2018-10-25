let Web3 = require('web3');
let networksConfig = require('./../../configs/network.json');
let contractsConfig = require('./../../configs/contracts.g.json');

let DataStoreABI = require('./../../web/public/abi/DataStore.json');
let DEXChainABI = require('./../../web/public/abi/DEXChain.json');
let OrderbookABI = require('./../../web/public/abi/Orderbook.json');

let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(networksConfig.exchange.provider));

let accounts;

let DataStore = new web3.eth.Contract(DataStoreABI, contractsConfig.datastore.address)
let DEXChain = new web3.eth.Contract(DEXChainABI, contractsConfig.exchange.address)
let Orderbook = new web3.eth.Contract(OrderbookABI, contractsConfig.orderbook.address)

describe('DataStore permissions', async () => {
	test('check if Orderbook is whitelisted', async (done) => {
		// accounts = await getAccounts();
		let allowed = await DataStore.methods.isContractAllowed(Orderbook.options.address).call()
		expect(allowed).toBe(true);
		done()
	})

})

function getAccounts() {
	return new Promise((resolve, reject) => {
		if (accounts != null) {
			resolve(accounts);
		} else {
			web3.eth.getAccounts(function (err, accounts_) {
				if (err) {
					reject(err);
				} else {
					resolve(accounts_);
				}
			});
		}
	})
}