const Exchange = artifacts.require("./Exchange.sol");
const BN = require('bn.js');

contract('Exchange contract', (accounts) => {
    let ExchangeInstance;
    let depositTransactionHash = "0x0000011111222223333344444555556666677777";

    let token1 = "0x2222233333444445555566666777778888899999";
    let token2 = "0x9999922222333334444455555666667777788888";
    let node1Address = "0xd2699c9d871f04f43d04dc9dbe669eee25eb3c85";
    let node2Address = "0x3180a5b7e284126853f0d0e21791f0749f1f1f22";
    let node3Address = "0xe75aa91d085a5475e8e15795218974cb262809ce";
    let unknownNode = accounts[9];

    let feeAccount = accounts[0];

    let orderHashes = [];
    
    it("should deploy Exchange", async () => {
        ExchangeInstance = await Exchange.deployed();
    });

    depositTokens(token1, accounts[2], "4456892342355335462132");
    depositTokens(token2, accounts[3], "9872346765123456456323");

    // 0x63b6a1d9cc58f4c4c2b22bf86e7da4b89ba49226d0ed4b4a300fc12c1a63f944
    placeOrder(token2, token1, "234354432345", "100", true, 1, accounts[2]);
    // 0x6a72b4cc37c8018a311e40bb157687c4522681236d9d3e0419d02376f50826f4
    placeOrder(token2, token1, "234354432345", "1000", false, 1, accounts[3]);

    cancelOrder(token1, accounts[2], 0);


    function depositTokens(tokenAddress, targetAccount, balanceToDep) {
        it("Node 1 should sign and relay Deposit to Exchange", async () => {
            const hash = await ExchangeInstance.deposit.sendTransaction(
                targetAccount,
                tokenAddress,
                balanceToDep,
                depositTransactionHash,
                {
                    from: node1Address
                }
            );
        });
    
        it("Node 1 should not sign and relay Deposit twice to Exchange", async () => {
            try {
                await ExchangeInstance.deposit.sendTransaction(
                    targetAccount,
                    tokenAddress,
                    balanceToDep,
                    depositTransactionHash,
                    {
                        from: node1Address
                    }
                );
                assert(false, "Transaction went through :(");
            } catch (e) {
                return;
            }
        });
    
        it("Unknown node should never sign and relay Deposit to Exchange", async () => {
            try {
                await ExchangeInstance.deposit.sendTransaction(
                    targetAccount,
                    tokenAddress,
                    balanceToDep,
                    depositTransactionHash,
                    {
                        from: unknownNode
                    }
                );
                assert(false, "Transaction went through :(");
            } catch (e) {
                return;
            }
        });
    
        it("Node 2 should sign and relay Deposit to Exchange", async () => {
            await ExchangeInstance.deposit.sendTransaction(
                targetAccount,
                tokenAddress,
                balanceToDep,
                depositTransactionHash,
                {
                    from: node2Address
                }
            );
        });
    
        it("Node 3 should sign and relay Deposit to Exchange", async () => {
            await ExchangeInstance.deposit.sendTransaction(
                targetAccount,
                tokenAddress,
                balanceToDep,
                depositTransactionHash,
                {
                    from: node3Address
                }
            );
        });
    
        it("Balance should have gone through to Exchange", async () => {
            await delay(3000);
            let balance = await ExchangeInstance.balanceOf.call(tokenAddress, targetAccount, {
                from: targetAccount
            });
    
            assert(balance.sub(balanceToDep).toString() == 0, "Balance not equal")
        });
    }

    function placeOrder(token, base, price, quantity, is_bid, nonce, creator) {
        it("should place buy order from account", async () => {
            const balanceBefore = await ExchangeInstance.escrowBalanceOf.call(is_bid ? base : token, creator);
            const hash = await ExchangeInstance.placeOrder.sendTransaction(token, base, price, quantity, is_bid, nonce, {
                from: creator
            });
            await delay(3000);
            const balanceAfter = await ExchangeInstance.escrowBalanceOf.call(is_bid ? base : token, creator);
            
            let t = new BN(price, 10);
            t = balanceBefore.add(t.mul(new BN(quantity, 10)));

            // // await delay(3000);

            // const logs = await getAllEvents('PlaceOrder', hash);

            // const orderHash = logs[0].args.orderHash;
            // orderHashes.push(orderHash);

            assert(balanceAfter.eq(t), "Incorrect balance");
        });
    }

    function cancelOrder(token, creator, index) {
        it("should cancel order", async () => {
            // TODO: Should also check fee deduction
            const orderHash = orderHashes[index];
            const balanceBefore = await ExchangeInstance.escrowBalanceOf.call(token, creator);
            await ExchangeInstance.cancelOrder.sendTransaction(orderHash, {
                from: creator
            });
            const balanceAfter = await ExchangeInstance.escrowBalanceOf.call(token, creator);

            assert(balanceAfter.lt(balanceBefore), "Incorrect balance");
        });
    }

    function getAllEvents(eventName, transactionHash) {
        return new Promise((resolve, reject) => {
            const transactionReceipt = web3.eth.getTransactionReceipt(transactionHash);

            const blockNumber = transactionReceipt.blockNumber;
            const allEvents = ExchangeInstance[eventName]({fromBlock: blockNumber, toBlock: blockNumber});

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
