const Exchange = artifacts.require("./Exchange.sol");

const address0 = '0x0000000000000000000000000000000000000000';
contract('Exchange', (accounts) => {
    let ExchangeInstance;
    let depositTransactionHash = "0x0000011111222223333344444555556666677777";
    let balanceToDep = "4456892342355335462132";

    let tokenAddress = "0x2222233333444445555566666777778888899999";
    let targetAccount1 = accounts[1];
    let node1Address = accounts[6];
    let node2Address = accounts[7];
    let node3Address = accounts[8];
    let unknownNode = accounts[9];
    
    it("should deploy Exchange",async () => {
        ExchangeInstance = await Exchange.deployed();
    });

    it("Node 1 should sign and relay Deposit to Exchange", async () => {
        const txHash = await ExchangeInstance.deposit.sendTransaction(
            targetAccount1,
            tokenAddress,
            balanceToDep,
            depositTransactionHash,
            {
                from: node1Address
            }
        );
        // console.log("N1Hash", txHash);
        // assert(false);
    });

    it("Node 1 should not sign and relay Deposit twice to Exchange", async () => {
        try {
            await ExchangeInstance.deposit.sendTransaction(
                targetAccount1,
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
                targetAccount1,
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
        const txHash = await ExchangeInstance.deposit.sendTransaction(
            targetAccount1,
            tokenAddress,
            balanceToDep,
            depositTransactionHash,
            {
                from: node2Address
            }
        );
        // console.log("N2Hash", txHash);
        // assert(false);
    });

    it("Node 3 should sign and relay Deposit to Exchange", async () => {
        await ExchangeInstance.deposit.sendTransaction(
            targetAccount1,
            tokenAddress,
            balanceToDep,
            depositTransactionHash,
            {
                from: node3Address
            }
        );
    });

    it("Balance should have gone through to Exchange", async () => {
        let balance = await ExchangeInstance.balanceOf.call(tokenAddress, targetAccount1, {
            from: targetAccount1
        });
        
        assert(balance.sub(balanceToDep).toString() == 0, "Balance not equal")
    });
});
