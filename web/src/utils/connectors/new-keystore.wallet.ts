import Web3 from 'web3'
import IWallet from '@/interfaces/iwallet'
import { PrivateKey } from 'web3/eth/accounts'
import BLOCKCHAIN_INFO from '@/core/blockchain'

async function createNewKeystore(passphrase: string): Promise<IWallet> {

  const provider = new Web3.providers.HttpProvider(BLOCKCHAIN_INFO.getNetworkInfo().provider)

  const web3 = new Web3(provider)

  const networkId = await web3.eth.net.getId()
  if (networkId != 1) {
    console.warn('You are not connected to mainnet')
  }

  let account: any
  let keystore: PrivateKey

  try {
    account = web3.eth.accounts.create()
    keystore = web3.eth.accounts.encrypt(account.privateKey, passphrase)
  } catch (err) {
    throw new Error(`Cannot create a new wallet: ${err.message}`)
  }

  const address = account.address

  let sendTx = async (tx: any): Promise<string> => {
    const nonce = await web3.eth.getTransactionCount(address)
    tx.from = address
    tx.nonce = nonce
    tx.chainId = networkId

    const signedTx = await account.signTransaction(tx)
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)

    return receipt.transactionHash
  }

  let sign = (data: string): Promise<string> => {
    return account.sign(data)
  }

  return {
    address,
    web3() { return web3 },
    networkId,
    sendTx,
    sign,
    keystore
  }
}

export default createNewKeystore