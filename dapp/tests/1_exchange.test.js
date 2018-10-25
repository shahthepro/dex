let Web3 = require('web3');
let networksConfig = require('./../../configs/network.json');
let contractsConfig = require('./../../configs/contracts.g.json');

let DataStoreABI = require('./../../web/public/abi/DataStore.json');
let DEXChainABI = require('./../../web/public/abi/DEXChain.json');
let OrderbookABI = require('./../../web/public/abi/Orderbook.json');

let BN = require('bn.js')

let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(networksConfig.exchange.provider));

let accounts;

let DataStore = new web3.eth.Contract(DataStoreABI, contractsConfig.datastore.address)
let DEXChain = new web3.eth.Contract(DEXChainABI, contractsConfig.exchange.address)
let Orderbook = new web3.eth.Contract(OrderbookABI, contractsConfig.orderbook.address)

let TEST_VALUES = {
    token1: "0x2222233333444445555566666777778888899999",
	token2: "0x9999922222333334444455555666667777788888",
	feeAccount: null,
	node1Address: null,
	node2Address: null,
	node3Address: null,
	hashPrefix: '0xf39fc526fb91b4d912c3f808a6f86da429c7319a86ac4ef819'
}

jest.setTimeout(30000)

describe('Permissions', () => {
	test('check if DEXChain is whitelisted', async (done) => {
		let allowed = await DataStore.methods.isContractAllowed(DEXChain.options.address).call()
		expect(allowed).toBe(true);
		done()
	})
	test('check if Orderbook is whitelisted', async (done) => {
		let allowed = await DataStore.methods.isContractAllowed(Orderbook.options.address).call()
		expect(allowed).toBe(true);
		done()
	})
	test('check if Orderbook is whitelisted for DEXChain', async (done) => {
		let allowed = await DEXChain.methods.isContractAllowed(Orderbook.options.address).call()
		expect(allowed).toBe(true);
		done()
	})
})

describe('Deposits', () => {
	test(`should deposit token 1 to account 1`, async (done) => {
		accounts = await getAccounts()
		let beforeDeposit = await DEXChain.methods.balanceOf(TEST_VALUES.token1, accounts[2]).call()
		beforeDeposit = new BN(beforeDeposit, 10)
		let toDep = '987123456789'
		let hash = TEST_VALUES.hashPrefix + Date.now() + '0';
		await depositToken(TEST_VALUES.token1, accounts[2], toDep, hash);
		// await delay(2000)
		let afterDeposit = await DEXChain.methods.balanceOf(TEST_VALUES.token1, accounts[2]).call()
		afterDeposit = new BN(afterDeposit, 10)
		expect(afterDeposit.sub(beforeDeposit.add(new BN(toDep, 10))).toNumber()).toBe(0)
		done()
	})

	test(`should deposit token 2 to account 2`, async (done) => {
		accounts = await getAccounts()
		let beforeDeposit = await DEXChain.methods.balanceOf(TEST_VALUES.token2, accounts[3]).call()
		beforeDeposit = new BN(beforeDeposit, 10)
		let toDep = '8769871236789'
		let hash = TEST_VALUES.hashPrefix + Date.now() + '0';
		await depositToken(TEST_VALUES.token2, accounts[3], toDep, hash);
		// await delay(2000)
		let afterDeposit = await DEXChain.methods.balanceOf(TEST_VALUES.token2, accounts[3]).call()
		afterDeposit = new BN(afterDeposit, 10)
		expect(afterDeposit.sub(beforeDeposit.add(new BN(toDep, 10))).toNumber()).toBe(0)
		done()
	})
})

function delay(timeInMillis) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve()
		}, timeInMillis)
	})
}

async function depositToken(tokenAddress, targetAccount, balanceToDep, hash) {
	await signDepositTx(tokenAddress, targetAccount, balanceToDep, hash, TEST_VALUES.node1Address)
	await signDepositTx(tokenAddress, targetAccount, balanceToDep, hash, TEST_VALUES.node2Address)
	await signDepositTx(tokenAddress, targetAccount, balanceToDep, hash, TEST_VALUES.node3Address)
}

function signDepositTx(tokenAddress, targetAccount, balanceToDep, depositTransactionHash, authorityAddress) {
	return DEXChain.methods.deposit(targetAccount, tokenAddress, balanceToDep, depositTransactionHash)
		.send({ from: authorityAddress, gas: '9876543211234', gasPrice: 0 })
}

function getAccounts() {
	return new Promise((resolve, reject) => {
		if (accounts != null) {
			resolve(accounts);
		} else {
			web3.eth.getAccounts(function (err, accounts_) {
				if (err) {
					reject(err);
				} else {
					TEST_VALUES.feeAccount = accounts_[0]
					TEST_VALUES.node1Address = accounts_[6]
					TEST_VALUES.node2Address = accounts_[7]
					TEST_VALUES.node3Address = accounts_[8]
					resolve(accounts_);
				}
			});
		}
	})
}