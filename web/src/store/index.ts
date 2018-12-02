import Vue from 'vue'
import Vuex from 'vuex'
import wallet from '@/store/modules/wallet/wallet';
import { TOKEN_PAIR_NAMESPACE, WALLET_NAMESPACE, DEPOSIT_FORM_NAMESPACE, ALL_OPEN_ORDERS_NAMESPACE, WALLET_BALANCES_NAMESPACE, WITHDRAW_REQUESTS_NAMESPACE } from '@/core/constants'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== `production`,
  getters: {
    pairInfo (state) {
      return state[TOKEN_PAIR_NAMESPACE]
    },
    tradeForm (state) {
      if (state[TOKEN_PAIR_NAMESPACE]) {
        return state[TOKEN_PAIR_NAMESPACE].tradeForm
      }
      return null
    },
    chartData (state) {
      if (state[TOKEN_PAIR_NAMESPACE]) {
        return state[TOKEN_PAIR_NAMESPACE].chartData.data
      }
      return null
    },
    tradeHistory (state) {
      if (state[TOKEN_PAIR_NAMESPACE]) {
        return state[TOKEN_PAIR_NAMESPACE].tradeHistory.data
      }
      return null
    },
    orderbook (state) {
      if (state[TOKEN_PAIR_NAMESPACE]) {
        return state[TOKEN_PAIR_NAMESPACE].orderbook
      }
      return null
    },
    openOrders (state) {
      if (state[TOKEN_PAIR_NAMESPACE]) {
        return state[TOKEN_PAIR_NAMESPACE].myOrders
      }
      return null
    },
    wallet (state) {
      return state[WALLET_NAMESPACE]
    },
    depositForm (state) {
      return state[DEPOSIT_FORM_NAMESPACE]
    },
    allOpenOrders (state) {
      if (state[ALL_OPEN_ORDERS_NAMESPACE]) {
        return state[ALL_OPEN_ORDERS_NAMESPACE].data
      }
      return null
    },
    walletBalances (state) {
      if (state[WALLET_BALANCES_NAMESPACE]) {
        return state[WALLET_BALANCES_NAMESPACE].data
      }
      return null
    },
    withdrawRequests (state) {
      if (state[WITHDRAW_REQUESTS_NAMESPACE]) {
        return state[WITHDRAW_REQUESTS_NAMESPACE].data
      }
      return null
    },
  },
  modules: {
    [WALLET_NAMESPACE]: wallet
  }
})
