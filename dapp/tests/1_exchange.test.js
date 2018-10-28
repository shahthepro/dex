let Web3 = require('web3');
let networksConfig = require('./../../configs/network.json');
let contractsConfig = require('./../../configs/contracts.g.json');

let DataStoreABI = require('./../../_tmp/DataStore.json');
let DEXChainABI = require('./../../_tmp/DEXChain.json');
// let OrderbookABI = require('./../../_tmp/Orderbook.json');
let NewOrderContractABI = require('./../../_tmp/NewOrderContract.json');
let CancelOrderContractABI = require('./../../_tmp/CancelOrderContract.json');

let BN = require('bn.js')

let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(networksConfig.exchange.provider));

let accounts;

let DataStore = new web3.eth.Contract(DataStoreABI, contractsConfig.datastore.address)
let DEXChain = new web3.eth.Contract(DEXChainABI, contractsConfig.exchange.address)
// let Orderbook = new web3.eth.Contract(OrderbookABI, contractsConfig.orderbook.address)
let NewOrderContract = new web3.eth.Contract(NewOrderContractABI, contractsConfig.neworder.address)
let CancelOrderContract = new web3.eth.Contract(CancelOrderContractABI, contractsConfig.cancelorder.address)

let TEST_VALUES = {
    token1: "0x2222233333444445555566666777778888899999",
	token2: "0x9999922222333334444455555666667777788888",
	feeAccount: null,
	node1Address: null,
	node2Address: null,
	node3Address: null,
	hashPrefix: '0xf39fc526fb91b4d912c3f808a6f86da429c7319a86ac4ef819'
}

let ORDER_HASHES = [];

jest.setTimeout(30000)

// describe('Permissions', () => {
// 	test('check if DEXChain is whitelisted', async (done) => {
// 		let allowed = await DataStore.methods.isContractAllowed(DEXChain.options.address).call()
// 		expect(allowed).toBe(true);
// 		done()
// 	})
// 	test('check if Orderbook is whitelisted', async (done) => {
// 		let allowed = await DataStore.methods.isContractAllowed(Orderbook.options.address).call()
// 		expect(allowed).toBe(true);
// 		done()
// 	})
// 	test('check if Orderbook is whitelisted for DEXChain', async (done) => {
// 		let allowed = await DEXChain.methods.isContractAllowed(Orderbook.options.address).call()
// 		expect(allowed).toBe(true);
// 		done()
// 	})
// })

describe('Deposits', () => {
	test(`should deposit token 1 to account 1`, async (done) => {
		accounts = await getAccounts()
		
		let beforeDeposit = await DEXChain.methods.balanceOf(TEST_VALUES.token1, accounts[2]).call()
		beforeDeposit = new BN(beforeDeposit, 10)
		
		let toDep = '987123456789'
		let hash = TEST_VALUES.hashPrefix + Date.now() + '0';
		await depositToken(TEST_VALUES.token1, accounts[2], toDep, hash);
		
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
		
		let afterDeposit = await DEXChain.methods.balanceOf(TEST_VALUES.token2, accounts[3]).call()
		afterDeposit = new BN(afterDeposit, 10)
		
		expect(afterDeposit.sub(beforeDeposit.add(new BN(toDep, 10))).toNumber()).toBe(0)
		
		done()
	})

	test('should place a buy order for token1/token2 from account 2', async (done) => {
		accounts = await getAccounts()

		let price = 100;
		let quantity = 1234;

		let volume = new BN((price * quantity).toString(), 10)

		let balanceBeforeOrder = await DEXChain.methods.balanceOf(TEST_VALUES.token2, accounts[3]).call()
		balanceBeforeOrder = new BN(balanceBeforeOrder, 10)
		let escrowBeforeOrder = await DEXChain.methods.escrowBalanceOf(TEST_VALUES.token2, accounts[3]).call()
		escrowBeforeOrder = new BN(escrowBeforeOrder, 10)

		let r = await NewOrderContract.methods.placeOrder(TEST_VALUES.token1, TEST_VALUES.token2, price, quantity, true, Date.now()).send({
			from: accounts[3],
			gasPrice: 0,
			gas: '100000000'
		})

		expect(r.status).toBe(true)
		expect(r.events.hasOwnProperty('PlaceOrder')).toBe(true)

		ORDER_HASHES.push(r.events.PlaceOrder.returnValues.orderHash);
		console.log(`Created order ${r.events.PlaceOrder.returnValues.orderHash}`);
		
		let balanceAfterOrder = await DEXChain.methods.balanceOf(TEST_VALUES.token2, accounts[3]).call()
		balanceAfterOrder = new BN(balanceAfterOrder, 10)
		let escrowAfterOrder = await DEXChain.methods.escrowBalanceOf(TEST_VALUES.token2, accounts[3]).call()
		escrowAfterOrder = new BN(escrowAfterOrder, 10)

		expect(balanceAfterOrder.sub(balanceBeforeOrder.sub(volume)).toNumber()).toBe(0)
		expect(escrowAfterOrder.sub(escrowBeforeOrder.add(volume)).toNumber()).toBe(0)

		done()
	})

	test('should cancel buy order', async (done) => {
		expect(ORDER_HASHES.length).toBeGreaterThanOrEqual(1)

		accounts = await getAccounts()

		let balanceBeforeCancel = await DEXChain.methods.balanceOf(TEST_VALUES.token2, accounts[3]).call()
		balanceBeforeCancel = new BN(balanceBeforeCancel, 10)
		let escrowBeforeCancel = await DEXChain.methods.escrowBalanceOf(TEST_VALUES.token2, accounts[3]).call()
		escrowBeforeCancel = new BN(escrowBeforeCancel, 10)

		let feeBalanceBeforeCancel = await DEXChain.methods.balanceOf(TEST_VALUES.token2, networksConfig.feeAccount).call()
		feeBalanceBeforeCancel = new BN(feeBalanceBeforeCancel, 10)

		let r = await CancelOrderContract.methods.cancelOrder(ORDER_HASHES[0]).send({
			from: accounts[3],
			gasPrice: 0,
			gas: '100000000'
		})

		expect(r.status).toBe(true)
		expect(r.events.hasOwnProperty('CancelOrder')).toBe(true)
		
		let balanceAfterCancel = await DEXChain.methods.balanceOf(TEST_VALUES.token2, accounts[3]).call()
		balanceAfterCancel = new BN(balanceAfterCancel, 10)
		let escrowAfterCancel = await DEXChain.methods.escrowBalanceOf(TEST_VALUES.token2, accounts[3]).call()
		escrowAfterCancel = new BN(escrowAfterCancel, 10)

		let feeBalanceAfterCancel = await DEXChain.methods.balanceOf(TEST_VALUES.token2, networksConfig.feeAccount).call()
		feeBalanceAfterCancel = new BN(feeBalanceAfterCancel, 10)

		// let volumeOfOrder = escrowBeforeCancel.sub(escrowAfterCancel)
		// let fee = feeBalanceAfterCancel.sub(feeBalanceBeforeCancel)
		// let returnedToAccount = balanceAfterCancel.sub(balanceBeforeCancel)

		// console.log(balanceBeforeCancel.toString(), escrowBeforeCancel.toString(), feeBalanceBeforeCancel.toString())
		// console.log(balanceAfterCancel.toString(), escrowAfterCancel.toString(), feeBalanceAfterCancel.toString())

		// console.log(volumeOfOrder.toString(), returnedToAccount.toString(), fee.toString())
		// // expect(returnedToAccount.add(fee).toString()).toBe(volumeOfOrder.toString())
		expect(balanceBeforeCancel.add(escrowBeforeCancel).add(feeBalanceBeforeCancel).sub(balanceAfterCancel).sub(escrowAfterCancel).sub(feeBalanceAfterCancel).toNumber()).toBe(0)

		done()
	})
})

// function getAllLogs(blockNumber, contractAddress) {
// 	return new Promise((resolve, reject) => {
// 		web3.eth.subscribe('logs', {
// 			address: contractAddress,
// 			from: blockNumber,
// 		}, function (err, result) {
// 			if (err) {
// 				reject(err)
// 				return
// 			} else {
// 				resolve(result)
// 			}
// 		})
// 	})
// }

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