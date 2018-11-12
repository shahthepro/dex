import store from '@/store'
import BLOCKCHAIN_INFO from '@/core/blockchain'
import TOKENS from '@/core/tokens'

async function placeOrder() {
  const { isConnected, current: wallet } = store.getters.wallet

  if (!isConnected) {
    throw new Error('You have not connected a wallet yet. Connect a wallet and then try again.')
  }

  const { token: tokenSymbol, base: baseSymbol, tradeForm: { side, price, amount } } = store.getters.pairInfo

  const ORDERBOOK_ABI = BLOCKCHAIN_INFO.getOrderbookABI()
  const ORDERBOOK_CONTRACT_ADDRESS = BLOCKCHAIN_INFO.getOrderbookContractInfo().address

  const web3 = wallet.web3()

  const token = TOKENS.getBySymbol(tokenSymbol)
  const base = TOKENS.getBySymbol(baseSymbol)

  let unitPrice = TOKENS.convertFixedToBigInt(price, base.decimal)
  let unitAmount = TOKENS.convertFixedToBigInt(amount, token.decimal)

  const OrderbookContract = new web3.eth.Contract(ORDERBOOK_ABI, ORDERBOOK_CONTRACT_ADDRESS)

  const data = OrderbookContract.methods.placeOrder(
    token.address,
    base.address,
    unitPrice,
    unitAmount,
    side === 0,
    Date.now()
  ).encodeABI()

  return wallet.sendTx({
    to: ORDERBOOK_CONTRACT_ADDRESS,
    value: 0,
    gas: 500000,
    gasPrice: 0,
    data
  })
}

export default { placeOrder }