import { DEPOSITFORM_AMOUNT_SETTER, DEPOSITFORM_GASPRICE_SETTER, DEPOSITFORM_TOKEN_SETTER } from '@/store/action-types'
import { COMMIT_DEPOSITFORM_AMOUNT, COMMIT_DEPOSITFORM_GASPRICE, COMMIT_DEPOSITFORM_TOKEN } from '@/store/mutation-types'
import IDepositForm from '@/interfaces/idepositform'

const state = <IDepositForm> {
	token: '',
  gasPrice: '',
  amount: ''
}

const actions = {
  // Trade form two-way binding
  [DEPOSITFORM_AMOUNT_SETTER] ({ commit }, value) {
    commit(COMMIT_DEPOSITFORM_AMOUNT, value)
  },
  [DEPOSITFORM_GASPRICE_SETTER] ({ commit }, value) {
    commit(COMMIT_DEPOSITFORM_GASPRICE, value)
  },
  [DEPOSITFORM_TOKEN_SETTER] ({ commit }, value) {
    commit(COMMIT_DEPOSITFORM_TOKEN, value)
  },
}

const mutations = {
  // Trade form two-way binding
  [COMMIT_DEPOSITFORM_AMOUNT] (state, value) {
    state.amount = value
  },
  [COMMIT_DEPOSITFORM_GASPRICE] (state, value) {
    state.gasPrice = value
  },
  [COMMIT_DEPOSITFORM_TOKEN] (state, value) {
    state.token = value
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