import { WITHDRAW_REQUESTS_GETTER } from '@/store/action-types'
import { COMMIT_WITHDRAW_REQUESTS } from '@/store/mutation-types'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service'

interface IWithdrawRequest {
  token: string
  recipient: string
  amount: string
  tx_hash: string
  withdraw_status: number
}

interface IWithdrawRequestState {
  data: IWithdrawRequest[]
}

const state = <IWithdrawRequestState>{
  data: []
}

const actions = {
  [WITHDRAW_REQUESTS_GETTER]({ commit }, args: any) {
    if (args.walletAddress == null) {
      commit(COMMIT_WITHDRAW_REQUESTS, [])
      return
    }

    APIService.getWithdrawRequests(args.walletAddress)
      .then(data => {

        for (let i = 0, len = data.length; i < len; i++) {
          let token = TOKENS.getByAddress(data[i].token)
          let decimal = token.decimal

          data[i].amount = TOKENS.convertBigIntToFixed(data[i].amount, decimal)
        }

        commit(COMMIT_WITHDRAW_REQUESTS, data)
      })
  },
}

const mutations = {
  [COMMIT_WITHDRAW_REQUESTS](state: IWithdrawRequestState, value) {
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