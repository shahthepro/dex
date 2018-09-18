import Vue from 'vue'
import Vuex from 'vuex'
import wallet from '@/store/modules/wallet/wallet';
import { TOKEN_PAIR_NAMESPACE, WALLET_NAMESPACE } from '@/core/constants'
import IWallet from '@/interfaces/iwallet';

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== `production`,
  getters: {
    pairInfo (state) {
      return state[TOKEN_PAIR_NAMESPACE]
    },
    wallet (state) {
      return state[WALLET_NAMESPACE]
    },
  },
  modules: {
    [WALLET_NAMESPACE]: wallet
  }
})
