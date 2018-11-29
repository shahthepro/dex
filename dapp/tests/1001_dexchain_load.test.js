let Web3 = require('web3');
let networksConfig = require('./../../configs/network.json');
let contractsConfig = require('./../../configs/contracts.g.json');

let DEXChainABI = require('./../../_tmp/DEXChain.json');

let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(networksConfig.exchange.provider));

let accounts;

let DEXChain = new web3.eth.Contract(DEXChainABI, contractsConfig.exchange.address)

let TEST_VALUES = {
    token1: "0x2222233333444445555566666777778888899999",
	token2: "0x9999922222333334444455555666667777788888",
	feeAccount: networksConfig.feeAccount,
	node1Address: networksConfig.authorities[0],
	node2Address: networksConfig.authorities[1],
	node3Address: networksConfig.authorities[2],
	hashPrefix: '0xf39fc526fb91b4d912c3f808a6f86da429c7319a86ac4'
}

jest.setTimeout(120000)

describe('Deposits', () => {
	test(`should do 300 deposit relays`, async (done) => {
		accounts = await getAccounts()
		
		let hashBase = TEST_VALUES.hashPrefix + Date.now();
		let x = 10000;
		
		let p = [];

		let balanceToDep = '9876543211234';

		for (let i = 0; i < 200; i++) {
			hash = hashBase + (x + i);
			p.push(signDepositTx(TEST_VALUES.token1, accounts[2], balanceToDep, hash, TEST_VALUES.node1Address))
			p.push(signDepositTx(TEST_VALUES.token1, accounts[2], balanceToDep, hash, TEST_VALUES.node2Address))
			// p.push(signDepositTx(TEST_VALUES.token1, accounts[2], balanceToDep, hash, TEST_VALUES.node3Address))
		}

		await Promise.all(p)
		
		done()
	})
})


function signDepositTx(tokenAddress, targetAccount, balanceToDep, depositTransactionHash, authorityAddress) {
	// return new Promise((resolve, reject) => {
	return DEXChain.methods.deposit(targetAccount, tokenAddress, balanceToDep, depositTransactionHash)
			.send({ from: authorityAddress, gas: '9876543211234', gasPrice: 0 })
	// 		.on('receipt', resolve)
	// 		.catch(reject)
	// })
}

function getAccounts() {
	return new Promise((resolve, reject) => {
		if (accounts != null) {
			resolve(accounts)
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