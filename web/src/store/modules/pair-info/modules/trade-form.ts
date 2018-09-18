import { TRADEFORM_PRICE_SETTER, TRADEFORM_SIDE_SETTER, TRADEFORM_AMOUNT_SETTER } from '@/store/action-types'
import { COMMIT_TRADEFORM_PRICE, COMMIT_TRADEFORM_SIDE, COMMIT_TRADEFORM_AMOUNT } from '@/store/mutation-types'
import ITradeForm from '@/interfaces/itradeform'

const state = <ITradeForm> {
  side: 0,
  price: '',
  amount: ''
}

const actions = {
  // Trade form two-way binding
  [TRADEFORM_PRICE_SETTER] ({ commit }, value) {
    commit(COMMIT_TRADEFORM_PRICE, value)
  },
  [TRADEFORM_AMOUNT_SETTER] ({ commit }, value) {
    commit(COMMIT_TRADEFORM_AMOUNT, value)
  },
  [TRADEFORM_SIDE_SETTER] ({ commit }, value) {
    commit(COMMIT_TRADEFORM_SIDE, value)
  },
}

const mutations = {
  // Trade form two-way binding
  [COMMIT_TRADEFORM_PRICE] (state, value) {
    state.price = value
  },
  [COMMIT_TRADEFORM_AMOUNT] (state, value) {
    state.amount = value
  },
  [COMMIT_TRADEFORM_SIDE] (state, value) {
    state.side = value
  },
}

const getters = {}

export default {
  state,
  actions,
  mutations,
  getters
}