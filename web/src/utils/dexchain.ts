import store from '@/store'
import BLOCKCHAIN_INFO from '@/core/blockchain'
import TOKENS from '@/core/tokens'

async function withdrawTokens(tokenAddress: string, amount: string) {
  const { isConnected, current: wallet } = store.getters.wallet

  if (!isConnected) {
    throw new Error('You have not connected a wallet yet. Connect a wallet and then try again.')
  }

  const EXCHANGE_ABI = BLOCKCHAIN_INFO.getExchangeABI()
  const EXCHANGE_CONTRACT_ADDRESS = BLOCKCHAIN_INFO.getExchangeContractInfo().address

  const web3 = wallet.web3()

  const token = TOKENS.getByAddress(tokenAddress)

  let unitAmount = TOKENS.convertFixedToBigInt(amount, token.decimal)

  const DEXChainContract = new web3.eth.Contract(EXCHANGE_ABI, EXCHANGE_CONTRACT_ADDRESS)

  const data = DEXChainContract.methods.transferHomeViaRelay(
    tokenAddress,
    unitAmount
  ).encodeABI()

  return wallet.sendTx({
    to: EXCHANGE_CONTRACT_ADDRESS,
    value: 0,
    gas: 500000,
    gasPrice: 0,
    data
  })
}

export default { withdrawTokens }