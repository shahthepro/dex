let Web3 = require('web3');
let networksConfig = require('./../../configs/network.json');

let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(networksConfig.exchange.provider));
	
	
let accounts;

describe('DataStore permissions', async () => {
	test('check if Orderbook is whitelisted', async () => {
		accounts = await getAccounts();
		expect(accounts.length).toBe(11);
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