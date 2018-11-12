import Vue from 'vue'
import Vuex from 'vuex'
import wallet from '@/store/modules/wallet/wallet';
import { TOKEN_PAIR_NAMESPACE, WALLET_NAMESPACE, DEPOSIT_FORM_NAMESPACE } from '@/core/constants'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== `production`,
  getters: {
    pairInfo (state) {
      return state[TOKEN_PAIR_NAMESPACE]
    },
    tradeForm (state) {
      return state[TOKEN_PAIR_NAMESPACE].tradeForm
    },
    chartData (state) {
      return state[TOKEN_PAIR_NAMESPACE].chartData.data
    },
    tradeHistory (state) {
      return state[TOKEN_PAIR_NAMESPACE].tradeHistory.data
    },
    orderbook (state) {
      return state[TOKEN_PAIR_NAMESPACE].orderbook
    },
    openOrders (state) {
      return state[TOKEN_PAIR_NAMESPACE].myOrders
    },
    wallet (state) {
      return state[WALLET_NAMESPACE]
    },
    depositForm (state) {
      return state[DEPOSIT_FORM_NAMESPACE]
    }
  },
  modules: {
    [WALLET_NAMESPACE]: wallet
  }
})
