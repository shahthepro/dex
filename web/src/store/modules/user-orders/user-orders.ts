import { USER_OPEN_ORDERS_GETTER, ALL_OPEN_ORDERS_REMOVER } from '@/store/action-types'
import { COMMIT_USER_PAIR_ORDERS } from '@/store/mutation-types'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service'
import { getShortDate } from '@/utils/general';
import IOrder from '@/interfaces/IOrder'

interface IMyOrdersState {
  data: IOrder[]

}

const state = <IMyOrdersState>{
  data: []
}

const actions = {
  [USER_OPEN_ORDERS_GETTER]({ commit }, args: any) {
    if (args.walletAddress == null) {
      commit(COMMIT_USER_PAIR_ORDERS, [])
      return
    }

    APIService.getAllOpenOrders(args.walletAddress)
      .then(data => {

        for (let i = 0, len = data.length; i < len; i++) {
          let token = TOKENS.getByAddress(data[i].token)
          let base = TOKENS.getByAddress(data[i].base)
          let decimal = base.decimal

          data[i].token = token.symbol
          data[i].base = base.symbol
          data[i].created_at = getShortDate(new Date(data[i].created_at * 1000))
          data[i].price = TOKENS.convertBigIntToFixed(data[i].price, decimal)
          data[i].quantity = TOKENS.convertBigIntToFixed(data[i].quantity, decimal)
          data[i].volume = TOKENS.convertBigIntToFixed(data[i].volume, decimal)
          data[i].volume_filled = TOKENS.convertBigIntToFixed(data[i].volume_filled, decimal)
        }

        commit(COMMIT_USER_PAIR_ORDERS, data)
      })
  },

  [ALL_OPEN_ORDERS_REMOVER]({ commit, state }, { orderHash }) {
    let hash: string = orderHash
    let data = state.data.filter((order) => {
      return order.order_hash != hash
    })

    commit(COMMIT_USER_PAIR_ORDERS, data)
  },
}

const mutations = {
  [COMMIT_USER_PAIR_ORDERS](state: IMyOrdersState, value) {
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