import store from '@/store'
import BLOCKCHAIN_INFO from '@/core/blockchain'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service';

function deposit() {
  const { isConnected, current: wallet } = store.getters.wallet
  
  if (!isConnected) {
    throw new Error('You have not connected a wallet yet. Connect a wallet and then try again.')
  }

  const { token: tokenSymbol, gasPrice, amount: amountToDeposit } = store.getters.depositForm

  const BRIDGE_ABI = BLOCKCHAIN_INFO.getBridgeABI()
  const BRIDGE_CONTRACT_ADDRESS = BLOCKCHAIN_INFO.getBridgeContractInfo().address

  const web3 = wallet.web3()

  const token = TOKENS.getBySymbol(tokenSymbol)

  const BridgeContract = new web3.eth.Contract(BRIDGE_ABI, BRIDGE_CONTRACT_ADDRESS)

  let unitsToDeposit = TOKENS.convertFixedToBigInt(amountToDeposit, token.decimal)

  let amount = unitsToDeposit
  let value = '0'

  const gasPriceInWei = web3.utils.toWei(gasPrice.toString(), 'shannon')

  if (tokenSymbol == 'ETH') {
    amount = '0'
    value = unitsToDeposit
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

async function withdraw(tx_hash, gasPrice) {
  const { isConnected, current: wallet } = store.getters.wallet
  
  if (!isConnected) {
    throw new Error('You have not connected a wallet yet. Connect a wallet and then try again.')
  }

  const BRIDGE_ABI = BLOCKCHAIN_INFO.getBridgeABI()
  const BRIDGE_CONTRACT_ADDRESS = BLOCKCHAIN_INFO.getBridgeContractInfo().address

  const web3 = wallet.web3()

  let signatures = await APIService.getWithdrawSigns(tx_hash)

  let vs: any[] = []
  let rs: any[] = []
  let ss: any[] = []
  let message: string = ''

  for (let i = 0; i < signatures.length; i++) {
    if (!message) {
      message = `0x${signatures[i].message_data}`
    }
    rs.push(`0x${signatures[i].message_sign.slice(0, 64)}`)
    ss.push(`0x${signatures[i].message_sign.slice(64, 128)}`)
    vs.push(`${parseInt(signatures[i].message_sign.slice(128, 130)) + 27}`)
  }

  const BridgeContract = new web3.eth.Contract(BRIDGE_ABI, BRIDGE_CONTRACT_ADDRESS)

  const gasPriceInWei = web3.utils.toWei(gasPrice.toString(), 'shannon')

  console.log(vs, rs, ss, message)

  const data = BridgeContract.methods.withdraw(
    vs,
    rs,
    ss,
    message,
  ).encodeABI()

  return wallet.sendTx({
    to: BRIDGE_CONTRACT_ADDRESS,
    gas: 500000,
    gasPrice: gasPriceInWei,
    data
  })
}

export default { deposit, withdraw }