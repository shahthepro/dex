import store from '@/store'
import BLOCKCHAIN_INFO from '@/core/blockchain'
import TOKENS from '@/core/tokens'

async function placeOrder() {
  const { isConnected, current: wallet } = store.getters.wallet

  if (!isConnected) {
    throw new Error('You have not connected a wallet yet. Connect a wallet and then try again.')
  }

  const { token: tokenSymbol, base: baseSymbol, tradeForm: { side, price, amount } } = store.getters.pairInfo

  const EXCHANGE_ABI = BLOCKCHAIN_INFO.getABI()
  const EXCHANGE_CONTRACT_ADDRESS = BLOCKCHAIN_INFO.getContractInfo().address

  const web3 = wallet.web3()

  const token = TOKENS.getBySymbol(tokenSymbol)
  const base = TOKENS.getBySymbol(baseSymbol)

  const ExchangeContract = new web3.eth.Contract(EXCHANGE_ABI, EXCHANGE_CONTRACT_ADDRESS)

  // const tokenData = TOKENS_INFO

  const data = ExchangeContract.methods.placeOrder(
    token.address,
    base.address,
    price,
    amount,
    side === 0,
    Date.now()
  ).encodeABI()

  return wallet.sendTx({
    to: EXCHANGE_CONTRACT_ADDRESS,
    value: 0,
    gas: 300000,
    gasPrice: 0,
    data
  })
}

export default { placeOrder }