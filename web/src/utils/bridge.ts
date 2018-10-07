import store from '@/store'
import BLOCKCHAIN_INFO from '@/core/blockchain'
import TOKENS from '@/core/tokens'

async function deposit() {
  const { isConnected, current: wallet } = store.getters.wallet
  
  if (!isConnected) {
    throw new Error('You have not connected a wallet yet. Connect a wallet and then try again.')
  }

  const { token: tokenSymbol, gasPrice, amount: amountToDeposit } = store.getters.depositForm

  const BRIDGE_ABI = BLOCKCHAIN_INFO.getABI()
  const BRIDGE_CONTRACT_ADDRESS = BLOCKCHAIN_INFO.getContractInfo().address

  const web3 = wallet.web3()

  const token = TOKENS.getBySymbol(tokenSymbol)

  const BridgeContract = new web3.eth.Contract(BRIDGE_ABI, BRIDGE_CONTRACT_ADDRESS)

  let amount = amountToDeposit
  let value = 0

  const gasPriceInWei = web3.utils.toWei(gasPrice, 'shannon')

  if (tokenSymbol == 'ETH') {
    amount = 0
    value = amountToDeposit
  }

  const data = BridgeContract.methods.deposit(
    token.address,
    amount
  ).encodeABI()

  return wallet.sendTx({
    to: BRIDGE_CONTRACT_ADDRESS,
    value: value,
    gas: 300000,
    gasPrice: gasPriceInWei,
    data
  })
}

export default { deposit }