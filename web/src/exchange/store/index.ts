import Vue from 'vue'
import Vuex from 'vuex'
import state from '@/exchange/store/state'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: true,
  state,
  mutations: {},
  actions: {}
})
