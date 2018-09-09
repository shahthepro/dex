import Vue from 'vue'
import Vuex from 'vuex'
// import tokens from '@/store/modules/tokens';
// import { TOKENS_NAMESPACE } from '@/store/action-types'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== `production`,
  modules: {
    // [TOKENS_NAMESPACE]: tokens
  }
})
