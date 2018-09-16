import Web3 from 'web3'
import IWallet from '@/interfaces/iwallet'

async function connectSoftwareWallet(): Promise<IWallet> {

  const provider = Web3.givenProvider

  if (!provider) {
    throw new Error("We cannot find any injected web3 instance. Is your software wallet enabled and running?")
  }

  const web3 = new Web3(provider)

  const networkId = await web3.eth.net.getId()
  if (networkId != 1) {
    console.warn('You are not connected to mainnet');
  }

  const accounts = await web3.eth.getAccounts()
  if (accounts.length == 0) {
    throw new Error('We cannot find any account or address in your software wallet. Make sure you have added at least one account and then try again.');
  }
  const address = accounts[0]

  let sendTx = async (tx: any): Promise<string> => {
    const nonce = await web3.eth.getTransactionCount(address)
    tx.from = address
    tx.nonce = nonce
    tx.chainId = networkId

    const receipt = await web3.eth.sendTransaction(tx)
    return receipt.transactionHash
  }

  let sign = (data: string): Promise<string> => {
    return web3.eth.sign(address, data)
  }

  return {
    address,
    web3() { return web3; },
    networkId,
    sendTx,
    sign
  }
}

export default connectSoftwareWallet