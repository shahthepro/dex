let Web3 = require('web3');
let networksConfig = require('./../../configs/network.json');
let contractsConfig = require('./../../configs/contracts.g.json');

let DataStoreABI = require('./../../_tmp/DataStore.json');
let DEXChainABI = require('./../../_tmp/DEXChain.json');
// let OrderbookABI = require('./../../_tmp/Orderbook.json');
let OrdersDBABI = require('./../../_tmp/OrdersDB.json');
let OrderbookABI = require('./../../_tmp/Orderbook.json');
let OrderMatchContractABI = require('./../../_tmp/OrderMatchContract.json');
let FeeContractABI = require('./../../_tmp/FeeContract.json');

let BN = require('bn.js')

let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(networksConfig.exchange.provider));

let accounts;

let DataStore = new web3.eth.Contract(DataStoreABI, contractsConfig.datastore.address)
let DEXChain = new web3.eth.Contract(DEXChainABI, contractsConfig.exchange.address)
let OrdersDB = new web3.eth.Contract(OrdersDBABI, contractsConfig.ordersdb.address)
let Orderbook = new web3.eth.Contract(OrderbookABI, contractsConfig.orderbook.address)
let OrderMatchContract = new web3.eth.Contract(OrderMatchContractABI, contractsConfig.ordermatch.address)
let FeeContract = new web3.eth.Contract(FeeContractABI, contractsConfig.ordermatch.address)

let TEST_VALUES = {
    // token1: "0xf230b790e05390fc8295f4d3f60332c93bed42e2",
	token1: "0xd850942ef8811f2a866692a623011bde52a462c1",
	token2: "0x0000000000000000000000000000000000000000",
	feeAccount: networksConfig.feeAccount,
	node1Address: networksConfig.authorities[0],
	node2Address: networksConfig.authorities[1],
	node3Address: networksConfig.authorities[2],
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
		
		await depositTokens(TEST_VALUES.token1, accounts[2], '987123456789')
		
		done()
	})

	test(`should deposit token 2 to account 2`, async (done) => {
		accounts = await getAccounts()
		
		await depositTokens(TEST_VALUES.token2, accounts[3], '8769871236789')
		
		done()
	})

	test('should place a buy order for token1/token2 from account 2', async (done) => {
		accounts = await getAccounts()

		let price = Math.max(180, 150 + parseInt((Math.random() * 100).toFixed(0)));
		let quantity = 123456789;
		
		let orderHash = await placeOrder(accounts[3], TEST_VALUES.token1, TEST_VALUES.token2, price, quantity, true)

		ORDER_HASHES.push(orderHash);
		console.log(`Created order ${orderHash}`);
		
		done()
	})

	test('should place a sell order for token1/token2 from account 1', async (done) => {
		accounts = await getAccounts()

		let price = Math.min(120 + parseInt((Math.random() * 100).toFixed(2)), 180);
		let quantity = 100006789;
		
		let orderHash = await placeOrder(accounts[2], TEST_VALUES.token1, TEST_VALUES.token2, price, quantity, false)

		ORDER_HASHES.push(orderHash);
		console.log(`Created order ${orderHash}`);

		done()
	})

	test('should place a buy order for token1/token2 from account 2', async (done) => {
		accounts = await getAccounts()

		let price = Math.max(180, 150 + parseInt((Math.random() * 100).toFixed(0)));
		let quantity = 100006789;
		
		let orderHash = await placeOrder(accounts[3], TEST_VALUES.token1, TEST_VALUES.token2, price, quantity, true)

		ORDER_HASHES.push(orderHash);
		console.log(`Created order ${orderHash}`);
		
		done()
	})

	test('should place a sell order for token1/token2 from account 1', async (done) => {
		accounts = await getAccounts()

		let price = Math.min(120 + parseInt((Math.random() * 100).toFixed(0)), 180);
		let quantity = 123456789;
		
		let orderHash = await placeOrder(accounts[2], TEST_VALUES.token1, TEST_VALUES.token2, price, quantity, false)

		ORDER_HASHES.push(orderHash);
		console.log(`Created order ${orderHash}`);

		done()
	})

	test('should match buy and sell orders', async (done) => {
		accounts = await getAccounts()

		await matchOrders(ORDER_HASHES[0], accounts[3], ORDER_HASHES[1], accounts[2], TEST_VALUES.token1, TEST_VALUES.token2)
		
		done()
	})

	test('should match buy and sell orders', async (done) => {
		accounts = await getAccounts()

		await matchOrders(ORDER_HASHES[2], accounts[3], ORDER_HASHES[3], accounts[2], TEST_VALUES.token1, TEST_VALUES.token2)
		
		done()
	})

	test('should cancel buy order', async (done) => {
		expect(ORDER_HASHES.length).toBeGreaterThanOrEqual(1)

		accounts = await getAccounts()

		await cancelOrder(accounts[3], TEST_VALUES.token2, ORDER_HASHES[0])

		done()
	})
})

async function depositTokens(tokenAddress, toAccount, toDeposit) {
	let beforeDeposit = await DEXChain.methods.balanceOf(tokenAddress, toAccount).call()
	beforeDeposit = new BN(beforeDeposit, 10)
	
	let hash = TEST_VALUES.hashPrefix + Date.now() + '0';
	await relayDepositTx(tokenAddress, toAccount, toDeposit, hash);
	
	let afterDeposit = await DEXChain.methods.balanceOf(tokenAddress, toAccount).call()
	afterDeposit = new BN(afterDeposit, 10)
	
	expect(afterDeposit.sub(beforeDeposit.add(new BN(toDeposit, 10))).toNumber()).toBe(0)
}

async function relayDepositTx(tokenAddress, targetAccount, balanceToDep, hash) {
	await signDepositTx(tokenAddress, targetAccount, balanceToDep, hash, TEST_VALUES.node1Address)
	await signDepositTx(tokenAddress, targetAccount, balanceToDep, hash, TEST_VALUES.node2Address)
	await signDepositTx(tokenAddress, targetAccount, balanceToDep, hash, TEST_VALUES.node3Address)
}

function signDepositTx(tokenAddress, targetAccount, balanceToDep, depositTransactionHash, authorityAddress) {
	return DEXChain.methods.deposit(targetAccount, tokenAddress, balanceToDep, depositTransactionHash)
		.send({ from: authorityAddress, gas: '9876543211234', gasPrice: 0 })
}

async function placeOrder(fromAddress, tokenAddress, baseAddress, price, quantity, isBid) {
	let volume = new BN((price * quantity).toString(), 10)

	let tokenToCheckBalance = (isBid) ? baseAddress : tokenAddress

	let balanceBeforeOrder = await DEXChain.methods.balanceOf(tokenToCheckBalance, fromAddress).call()
	balanceBeforeOrder = new BN(balanceBeforeOrder, 10)
	let escrowBeforeOrder = await DEXChain.methods.escrowBalanceOf(tokenToCheckBalance, fromAddress).call()
	escrowBeforeOrder = new BN(escrowBeforeOrder, 10)

	let r = await Orderbook.methods.placeOrder(tokenAddress, baseAddress, price, quantity, isBid, Date.now()).send({
		from: fromAddress,
		gasPrice: 0,
		gas: '100000000'
	})

	expect(r.status).toBe(true)
	let orderHash
	if (isBid) {
		expect(r.events.hasOwnProperty('PlaceBuyOrder')).toBe(true)
		orderHash = r.events.PlaceBuyOrder.returnValues.orderHash
	} else {
		expect(r.events.hasOwnProperty('PlaceSellOrder')).toBe(true)
		orderHash = r.events.PlaceSellOrder.returnValues.orderHash
	}
	
	let balanceAfterOrder = await DEXChain.methods.balanceOf(tokenToCheckBalance, fromAddress).call()
	balanceAfterOrder = new BN(balanceAfterOrder, 10)
	let escrowAfterOrder = await DEXChain.methods.escrowBalanceOf(tokenToCheckBalance, fromAddress).call()
	escrowAfterOrder = new BN(escrowAfterOrder, 10)

	expect(balanceAfterOrder.sub(balanceBeforeOrder.sub(volume)).toNumber()).toBe(0)
	expect(escrowAfterOrder.sub(escrowBeforeOrder.add(volume)).toNumber()).toBe(0)

	return orderHash
}

async function cancelOrder(fromAddress, tokenAddress, orderHash) {

	let balanceBeforeCancel = await DEXChain.methods.balanceOf(tokenAddress, fromAddress).call()
	balanceBeforeCancel = new BN(balanceBeforeCancel, 10)
	let escrowBeforeCancel = await DEXChain.methods.escrowBalanceOf(tokenAddress, fromAddress).call()
	escrowBeforeCancel = new BN(escrowBeforeCancel, 10)

	let feeBalanceBeforeCancel = await DEXChain.methods.balanceOf(tokenAddress, networksConfig.feeAccount).call()
	feeBalanceBeforeCancel = new BN(feeBalanceBeforeCancel, 10)

	let availableVolumeOfOrder = await OrdersDB.methods.getOrderAvailableVolume(orderHash).call()
	availableVolumeOfOrder = new BN(availableVolumeOfOrder, 10)
	
	expect(escrowBeforeCancel.sub(availableVolumeOfOrder).toNumber()).toBeGreaterThanOrEqual(0)

	let r = await Orderbook.methods.cancelOrder(orderHash).send({
		from: fromAddress,
		gasPrice: 0,
		gas: '100000000'
	})

	expect(r.status).toBe(true)
	expect(r.events.hasOwnProperty('CancelOrder')).toBe(true)
	
	let balanceAfterCancel = await DEXChain.methods.balanceOf(tokenAddress, fromAddress).call()
	balanceAfterCancel = new BN(balanceAfterCancel, 10)
	let escrowAfterCancel = await DEXChain.methods.escrowBalanceOf(tokenAddress, fromAddress).call()
	escrowAfterCancel = new BN(escrowAfterCancel, 10)

	let feeBalanceAfterCancel = await DEXChain.methods.balanceOf(tokenAddress, networksConfig.feeAccount).call()
	feeBalanceAfterCancel = new BN(feeBalanceAfterCancel, 10)

	// let volumeOfOrder = escrowBeforeCancel.sub(escrowAfterCancel)
	// let fee = feeBalanceAfterCancel.sub(feeBalanceBeforeCancel)
	// let returnedToAccount = balanceAfterCancel.sub(balanceBeforeCancel)

	// console.log(balanceBeforeCancel.toString(), escrowBeforeCancel.toString(), feeBalanceBeforeCancel.toString())
	// console.log(balanceAfterCancel.toString(), escrowAfterCancel.toString(), feeBalanceAfterCancel.toString())

	// console.log(volumeOfOrder.toString(), returnedToAccount.toString(), fee.toString())
	// expect(returnedToAccount.add(fee).toString()).toBe(volumeOfOrder.toString())
	expect(balanceBeforeCancel.add(escrowBeforeCancel).add(feeBalanceBeforeCancel).sub(balanceAfterCancel).sub(escrowAfterCancel).sub(feeBalanceAfterCancel).toNumber()).toBe(0)
}

async function matchOrders(buyOrderHash, buyOwner, sellOrderHash, sellOwner, tokenAddress, baseAddress) {
	let buyerTokenBalanceBeforeMatch = await DEXChain.methods.balanceOf(tokenAddress, buyOwner).call()
	buyerTokenBalanceBeforeMatch = new BN(buyerTokenBalanceBeforeMatch, 10)
	let buyerBaseEscrowBeforeMatch = await DEXChain.methods.escrowBalanceOf(baseAddress, buyOwner).call()
	buyerBaseEscrowBeforeMatch = new BN(buyerBaseEscrowBeforeMatch, 10)

	let sellerTokenEscrowBeforeMatch = await DEXChain.methods.escrowBalanceOf(tokenAddress, sellOwner).call()
	sellerTokenEscrowBeforeMatch = new BN(sellerTokenEscrowBeforeMatch, 10)
	let sellerBaseBalanceBeforeMatch = await DEXChain.methods.balanceOf(baseAddress, sellOwner).call()
	sellerBaseBalanceBeforeMatch = new BN(sellerBaseBalanceBeforeMatch, 10)
	
	let feeBaseBalanceBeforeMatch = await DEXChain.methods.balanceOf(baseAddress, TEST_VALUES.feeAccount).call()
	feeBaseBalanceBeforeMatch = new BN(feeBaseBalanceBeforeMatch, 10)
	let feeTokenBalanceBeforeMatch = await DEXChain.methods.balanceOf(tokenAddress, TEST_VALUES.feeAccount).call()
	feeTokenBalanceBeforeMatch = new BN(feeTokenBalanceBeforeMatch, 10)

	let r = await OrderMatchContract.methods.matchOrders(buyOrderHash, sellOrderHash).send({
		from: accounts[0],
		gasPrice: 0,
		gas: '100000000'
	})

	expect(r.status).toBe(true)
	expect(r.events.hasOwnProperty('Trade')).toBe(true)

	let tradedVolume = new BN(r.events.Trade.returnValues.volume, 10)

	let buyerTokenBalanceAfterMatch = await DEXChain.methods.balanceOf(tokenAddress, buyOwner).call()
	buyerTokenBalanceAfterMatch = new BN(buyerTokenBalanceAfterMatch, 10)
	let buyerBaseEscrowAfterMatch = await DEXChain.methods.escrowBalanceOf(baseAddress, buyOwner).call()
	buyerBaseEscrowAfterMatch = new BN(buyerBaseEscrowAfterMatch, 10)

	let sellerTokenEscrowAfterMatch = await DEXChain.methods.escrowBalanceOf(tokenAddress, sellOwner).call()
	sellerTokenEscrowAfterMatch = new BN(sellerTokenEscrowAfterMatch, 10)
	let sellerBaseBalanceAfterMatch = await DEXChain.methods.balanceOf(baseAddress, sellOwner).call()
	sellerBaseBalanceAfterMatch = new BN(sellerBaseBalanceAfterMatch, 10)
	
	let feeBaseBalanceAfterMatch = await DEXChain.methods.balanceOf(baseAddress, TEST_VALUES.feeAccount).call()
	feeBaseBalanceAfterMatch = new BN(feeBaseBalanceAfterMatch, 10)
	let feeTokenBalanceAfterMatch = await DEXChain.methods.balanceOf(tokenAddress, TEST_VALUES.feeAccount).call()
	feeTokenBalanceAfterMatch = new BN(feeTokenBalanceAfterMatch, 10)

	let makeFee = feeTokenBalanceAfterMatch.sub(feeTokenBalanceBeforeMatch)
	let takeFee = feeBaseBalanceAfterMatch.sub(feeBaseBalanceBeforeMatch)

	console.log(`Traded volume: ${tradedVolume.toString()}\nMake fee: ${makeFee.toString()}\nTake fee: ${takeFee.toString()}`)
	// console.log(buyerBaseEscrowBeforeMatch.toString(), buyerBaseEscrowAfterMatch.toString())
	// console.log(sellerTokenEscrowBeforeMatch.toString(), sellerTokenEscrowAfterMatch.toString())
	// console.log(buyerTokenBalanceBeforeMatch.toString(), buyerTokenBalanceAfterMatch.toString())
	// console.log(sellerBaseBalanceBeforeMatch.toString(), sellerBaseBalanceAfterMatch.toString())
	expect(buyerBaseEscrowBeforeMatch.sub(buyerBaseEscrowAfterMatch).sub(tradedVolume).toNumber()).toBe(0)
	expect(sellerTokenEscrowBeforeMatch.sub(sellerTokenEscrowAfterMatch).sub(tradedVolume).toNumber()).toBe(0)
	expect(buyerTokenBalanceAfterMatch.sub(buyerTokenBalanceBeforeMatch).add(makeFee).sub(tradedVolume).toNumber()).toBe(0)
	expect(sellerBaseBalanceAfterMatch.sub(sellerBaseBalanceBeforeMatch).add(takeFee).sub(tradedVolume).toNumber()).toBe(0)
	// expect(buyerBaseEscrowBeforeMatch.sub(buyerBaseEscrowAfterMatch).sub(tradedVolume).sub(takeFee).toNumber()).toBe(0)
	// expect(buyerTokenBalanceAfterMatch.sub(buyerTokenBalanceBeforeMatch).sub(tradedVolume).sub(makeFee).toNumber()).toBe(0)
	// expect(sellerTokenEscrowBeforeMatch.sub(sellerTokenEscrowAfterMatch).sub(tradedVolume).sub(makeFee).toNumber()).toBe(0)
	// expect(sellerBaseBalanceAfterMatch.sub(sellerBaseBalanceBeforeMatch).sub(tradedVolume).sub(takeFee).toNumber()).toBe(0)
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
					// TEST_VALUES.feeAccount = accounts_[0]
					// TEST_VALUES.node1Address = accounts_[6]
					// TEST_VALUES.node2Address = accounts_[7]
					// TEST_VALUES.node3Address = accounts_[8]
					resolve(accounts_);
				}
			});
		}
	})
}