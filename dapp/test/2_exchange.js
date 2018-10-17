const Exchange = artifacts.require("./Exchange.sol");
const BN = require('bn.js');

contract('Exchange contract', (accounts) => {
    let ExchangeInstance;
    let depositTransactionHash = "0xf39fc526fb91b4d912c3f808a6f86da429c7319a86ac4ef819";

    let token1 = "0x2222233333444445555566666777778888899999";
    let token2 = "0x9999922222333334444455555666667777788888";

    let node1Address = accounts[6]; // "0xee457955f8ee9bbfdf357b20c287a470abb8012f";
    let node2Address = accounts[7]; // "0xcba46a07b311a87cefd88a382345037bed7b30e3";
    let node3Address = accounts[8]; // "0xb663baefe3d58c7879432a9378173dab3c9cbf8c";
    let unknownNode = accounts[9];

    let feeAccount = accounts[0];

    let orderHashes = [];

    let tIndex = 0;

    // it("should deploy Exchange", () => {
    //     ExchangeInstance = await Exchange.deployed();
    // });

    depositTokens(token1, accounts[2], "4456892342355335462132");
    depositTokens(token2, accounts[3], "9872346765123456456323");

    // 0x57994b8b569f70b39675eb86908665cac734ed11a5290428cd8270fa7fb72423
    placeOrder(token2, token1, "2343544345", "100", true, 1, accounts[2]);
    // 0x0f1f6da978abb51642c9faa1c9b3a23c388b93e3990371cd82db4825322c3073
    placeOrder(token2, token1, "234352345", "1000", false, 1, accounts[3]);

    cancelOrder("0x57994b8b569f70b39675eb86908665cac734ed11a5290428cd8270fa7fb72423", token1, accounts[2]);
    cancelOrder("0x0f1f6da978abb51642c9faa1c9b3a23c388b93e3990371cd82db4825322c3073", token2, accounts[3]);

    // orderHashes.push('0x89d6d8cbbd569426a1498e3723d677021495b2077b19780549bb55a52cc05994')
    // orderHashes.push('0xd0e8e89c8aa0be039d97bece081e662fc6802fdffed32b84bf6b442d265ad002')
    // // cancelOrder(token1, accounts[2], 0);
    // // cancelOrder(token2, accounts[3], 1);

    function signDepositTx(instance, targetAccount, tokenAddress, balanceToDep, depositTransactionHash, authorityAddress) {
        return instance.deposit.sendTransaction(
            targetAccount,
            tokenAddress,
            balanceToDep,
            depositTransactionHash,
            {
                from: authorityAddress
            }
        );
    }

    function depositTokens(tokenAddress, targetAccount, balanceToDep) {
        it(`Should deposit ${balanceToDep} ${tokenAddress} to ${targetAccount}`, () => {
            
            let instance;

            let depHash = depositTransactionHash + Date.now() + tIndex;
            tIndex++;
            
            return Exchange.deployed()
                .then(inst => {
                    instance = inst;
                    return signDepositTx(instance, targetAccount, tokenAddress, balanceToDep, depHash, node1Address);
                })
                .then(() => {
                    return signDepositTx(instance, targetAccount, tokenAddress, balanceToDep, depHash, node2Address);
                })
                .then(() => {
                    return signDepositTx(instance, targetAccount, tokenAddress, balanceToDep, depHash, node3Address);
                })
                .then(() => {
                    return instance.balanceOf.call(tokenAddress, targetAccount, { from: targetAccount });
                })
                .then(balance => {
                    assert(balance.sub(balanceToDep) == 0, `Expected balance to be ${balanceToDep.toString()} but got ${balance.toString()}`);
                });
        });
    }

    function placeOrder(token, base, price, quantity, is_bid, nonce, creator) {
        it("should place order from account", () => {
            
            let instance;
            let balanceBefore;

            return Exchange.deployed()
                .then(inst => {
                    instance = inst;
                    return instance.balanceOf.call(is_bid ? base : token, creator);
                })
                .then((balance) => {
                    balanceBefore = balance;
                    return instance.placeOrder.sendTransaction(token, base, price, quantity, is_bid, nonce, {
                        from: creator
                    });
                })
                .then(() => {
                    return instance.balanceOf.call(is_bid ? base : token, creator);
                })
                .then((balanceAfter) => {
                    let t = new BN(price, 10);

                    t = balanceBefore.sub(t.mul(new BN(quantity, 10)));
                    assert(balanceAfter.eq(t), `Expected balance to be ${t.toString()} but got ${balanceAfter.toString()}`);
                });
        });
    }

    function cancelOrder(orderHash, token, creator, index) {
        it("should cancel order", () => {
            
            let instance;
            let balanceBefore;

            return Exchange.deployed()
                .then(inst => {
                    instance = inst;
                    return instance.escrowBalanceOf.call(token, creator);
                })
                .then((balance) => {
                    balanceBefore = balance;
                    return instance.cancelOrder.sendTransaction(orderHash, {
                        from: creator
                    });
                })
                .then(() => {
                    return instance.escrowBalanceOf.call(token, creator);
                })
                .then((balanceAfter) => {
                    assert(balanceAfter.eq(0), `Expected escrow balance to be 0 but got ${balanceAfter.toString()}`);
                });
        });
    }

    function getAllEvents(event, receipt) {
        return new Promise((resolve, reject) => {
            // const receipt = web3.eth.getTransactionReceipt(transactionHash);

            const blockNumber = receipt.blockNumber;
            const allEvents = event({fromBlock: blockNumber, toBlock: blockNumber});

            allEvents.get((err, logs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(logs.filter(log => log.transactionHash === receipt.transactionHash));
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
