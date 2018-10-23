const HomeBridge = artifacts.require("./HomeBridge.sol");
const BN = require('bn.js');

contract('HomeBridge contract', (accounts) => {
    let HomeBridgeInstance;
    let depositTransactionHash = "0x0000011111222223333344444555556666677777";

    let token0 = "0x0000000000000000000000000000000000000000";
    let token1 = "0x2222233333444445555566666777778888899999";
    let token2 = "0x9999922222333334444455555666667777788888";
    let node1Address = "0xd2699c9d871f04f43d04dc9dbe669eee25eb3c85";
    let node2Address = "0x3180a5b7e284126853f0d0e21791f0749f1f1f22";
    let node3Address = "0xe75aa91d085a5475e8e15795218974cb262809ce";
    let unknownNode = accounts[9];

    let feeAccount = accounts[0];

    let orderHashes = [];
    
    it("should deploy HomeBridge", async () => {
        HomeBridgeInstance = await HomeBridge.deployed();
    });

    depositTokens(token2, accounts[0], "4456892342355335462132");
    depositTokens(token1, accounts[0], "4456892342355335462132");
    // depositTokens(token0, accounts[2], "4456892342355335462132");
    // depositTokens(token1, accounts[2], "4456892342355335462132");
    // depositTokens(token2, accounts[3], "9872346765123456456323");

    function depositTokens(tokenAddress, targetAccount, balanceToDep) {
		let value = 0;
		let amount = balanceToDep;
		if (tokenAddress == token0) {
			value = amount;
			amount = 0;
		}
		it(`Should deposit ${balanceToDep} tokens(${tokenAddress}) to ${targetAccount}`, async () => {
			await HomeBridgeInstance.deposit.sendTransaction(
				tokenAddress,
				amount,
				{
					from: targetAccount,
					value: value
				}
			);
        });
    }

    function getAllEvents(eventName, transactionHash) {
        return new Promise((resolve, reject) => {
            const transactionReceipt = web3.eth.getTransactionReceipt(transactionHash);

            const blockNumber = transactionReceipt.blockNumber;
            const allEvents = HomeBridgeInstance[eventName]({fromBlock: blockNumber, toBlock: blockNumber});

            allEvents.get((err, logs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(logs.filter(log => log.transactionHash === transactionHash));
                }
            })
            // event.stopWatching();
        });
    }

    function delay(milliseconds) {
        return new Promise((resolve, _) => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        })
    }
});
