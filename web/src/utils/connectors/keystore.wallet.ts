import Web3 from 'web3'
import IWallet from '@/interfaces/iwallet'
import BLOCKCHAIN_INFO from '@/core/blockchain'

async function readJSONFileAsString(jsonFile: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.readAsArrayBuffer(jsonFile)

    reader.onloadend = () => {
      const decoder = new TextDecoder()

      // @ts-ignore
      resolve(decoder.decode(reader.result))
    }

    reader.onerror = reject
  })
}

async function unlockWithKeystoreFile(keystoreFile: File, passphrase: string): Promise<IWallet> {

  let v3json

  try {
    v3json = await readJSONFileAsString(keystoreFile)
  } catch (e) {
    throw new Error(`The selected file is not a valid JSON file. Try another keystore file.`)
  }

  const provider = new Web3.providers.HttpProvider(BLOCKCHAIN_INFO.getNetworkInfo().provider)

  const web3 = new Web3(provider)

  const networkId = await web3.eth.net.getId()
  if (networkId != 1) {
    console.warn('You are not connected to mainnet')
  }

  let account: any

  try {
    account = web3.eth.accounts.decrypt(v3json, passphrase)
  } catch (err) {
    throw new Error(`Cannot decrypt the keystore file: ${err.message}`)
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
    sign
  }
}

export default unlockWithKeystoreFile