import { WALLET_BALANCES_GETTER } from '@/store/action-types'
import { COMMIT_WALLET_BALANCES } from '@/store/mutation-types'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service'

interface IWalletBalance {
  token: string
  wallet: string
  balance: string
  escrow: string
}

interface IWalletBalanceState {
  data: IWalletBalance[]

}

const state = <IWalletBalanceState>{
  data: []
}

const actions = {
  [WALLET_BALANCES_GETTER]({ commit }, args: any) {
    if (args.walletAddress == null) {
      commit(COMMIT_WALLET_BALANCES, [])
      return
    }

    APIService.getWalletBalances(args.walletAddress)
      .then(data => {

        for (let i = 0, len = data.length; i < len; i++) {
          let tpken = TOKENS.getByAddress(data[i].token)
          let decimal = tpken.decimal

          data[i].escrow = TOKENS.convertBigIntToFixed(data[i].escrow, decimal)
          data[i].balance = TOKENS.convertBigIntToFixed(data[i].balance, decimal)
        }

        commit(COMMIT_WALLET_BALANCES, data)
      })
  },
}

const mutations = {
  [COMMIT_WALLET_BALANCES](state: IWalletBalanceState, value) {
    state.data = value
  },
}

const getters = {}

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
}