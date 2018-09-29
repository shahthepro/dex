import Web3 from 'web3'
import { PrivateKey } from 'web3/eth/accounts'


interface IWallet {
    web3(): Web3
    networkId: number
    address: string
    keystore?: PrivateKey
    sendTx(tx: any): Promise<any>
    sign(data: string): Promise<string>
}

export default IWallet