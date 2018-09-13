import Web3 from 'web3';
import IWallet from '@/interfaces/iwallet';
import store from '@/store';

async function unlockWithPrivateKey(privateKey: string): Promise<IWallet> {

    const provider = new Web3.providers.HttpProvider(store.getters.app.home.provider);

    const web3 = new Web3(provider);

    const networkId = await web3.eth.net.getId();
    if (networkId != 1) {
        console.warn('You are not connected to mainnet');
    }

    let account: any;

    try {
        account = web3.eth.accounts.privateKeyToAccount(privateKey);
    } catch (err) {
        throw new Error(`The private key you entered is not valid. Please try again.`)
    }

    // delete account.privateKey;
    // account.privateKey = '';
    privateKey = '';

    const address = account.address;

    let sendTx = async (tx: any): Promise<string> => {
        const nonce = await web3.eth.getTransactionCount(address);
        tx.from = address;
        tx.nonce = nonce;
        tx.chainId = networkId;

        const signedTx = await account.signTransaction(tx);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        return receipt.transactionHash;
    };

    let sign = (data: string): Promise<string> => {
        return account.sign(data);
    };

    return {
        address,
        web3() { return web3; },
        networkId,
        sendTx,
        sign
    };
}

export default unlockWithPrivateKey;