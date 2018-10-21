const DataStore = artifacts.require('./core/DataStore.sol');
const Orderbook = artifacts.require('./core/Orderbook.sol');

contract('Orderbook', function (accounts) {
	it("Should whitelist Orderbook", function () {
		let DataStoreInstance = web3.eth.contract(DataStore.abi).at(DataStore.address);
		let OrderbookInstance = web3.eth.contract(Orderbook.abi).at(Orderbook.address);

		console.log(Orderbook.address)
		return DataStoreInstance.whitelistContract(Orderbook.address).send({ from: accounts[0] })
		.then(function () {
			return DataStoreInstance.isContractAllowed(Orderbook.address).call({ from: accounts[0] })
		})
		.then(function (resp) {
			console.log("RESP", resp)
		})


		// await DataStore.deployed()
		// 	.then(function (ds) {
		// 		instance = ds;
		// 		// return Orderbook.deployed();
		// 	})
		// 	// .then(function (ob) {
		// 	// 	OrderbookInstance = ob;
		// 	// 	return instance.whitelistContract.sendTransaction(Orderbook.address);
		// 	// })
		// 	.then(function (txHash) {
		// 		console.log(txHash);
		// 		return new Promise(function (resolve, reject) {
		// 			setTimeout(function () { resolve() }, 3000);
		// 		})
		// 	})
		// 	.then(function () {
		// 		return instance.isContractAllowed(Orderbook.address);
		// 	})
		// 	.then(function (resp) {
		// 		console.log("RESP", resp, Orderbook.address, DataStore.address);
		// 		assert(resp == true, "Not whitelisted");
		// 		// console.log("RESP", resp);
		// 	})
	})
});