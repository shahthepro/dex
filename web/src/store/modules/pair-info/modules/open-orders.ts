import { USER_PAIR_ORDERS_GETTER, PAIR_ORDERS_ORDER_REMOVER, FILL_OPENORDER_ORDER, ADD_OPENORDER_ORDER, CANCEL_OPENORDER_ORDER } from '@/store/action-types'
import { COMMIT_USER_PAIR_ORDERS, COMMIT_ADD_USER_OPEN_ORDER } from '@/store/mutation-types'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service'
import { getShortDate } from '@/utils/general';

interface IOrder {
  order_hash: string
  token: string
  base: string
  price: string
  quantity: string
  is_bid: boolean
  created_at: string
  created_by: string
  volume: string
  volume_filled: string
  is_open: boolean
}

interface IMyOrdersState {
	data: IOrder[]

}

const state = <IMyOrdersState> {
	data: []
}

const actions = {
  [USER_PAIR_ORDERS_GETTER] ({ commit }, args: any) {
    if (args.walletAddress == null) {
      commit(COMMIT_USER_PAIR_ORDERS, [])
      return
    }
    
	  let token = TOKENS.getBySymbol(args.token)
    let base = TOKENS.getBySymbol(args.base)
    
    APIService.getOpenOrders(token.address, base.address, args.walletAddress)
      .then(data => {

        let decimal = base.decimal
        
        for (let i = 0, len = data.length; i < len; i++) {
          data[i].created_at = getShortDate(new Date(data[i].created_at * 1000))
          data[i].price = TOKENS.convertBigIntToFixed(data[i].price, decimal)
          data[i].quantity = TOKENS.convertBigIntToFixed(data[i].quantity, decimal)
          data[i].volume = TOKENS.convertBigIntToFixed(data[i].volume, decimal)
          data[i].volume_filled = TOKENS.convertBigIntToFixed(data[i].volume_filled, decimal)
        }

        commit(COMMIT_USER_PAIR_ORDERS, data)
      })
  },

  [PAIR_ORDERS_ORDER_REMOVER] ({ commit, state }, { orderHash }) {
    let hash: string = orderHash
    let data = state.data.filter((order) => {
      return order.order_hash != hash
    })

    commit(COMMIT_USER_PAIR_ORDERS, data)
  },

  [FILL_OPENORDER_ORDER] ({ commit, state, rootGetters }, order: any) {
    let base = TOKENS.getBySymbol(rootGetters.pairInfo.base)
    let decimal = base.decimal

    let orders = JSON.parse(JSON.stringify(state.data))

    let orderFound = false
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].order_hash.toLowerCase() == order.order_hash.toLowerCase()) {
        orderFound = true
        orders[i].volume_filled = TOKENS.convertBigIntToFixed(order.volume_filled, decimal)
      }
    }

    if (!orderFound) {
      return
    }

    commit(COMMIT_USER_PAIR_ORDERS, orders)
  },

  [ADD_OPENORDER_ORDER] ({ commit, state, rootGetters }, order: any) {
    let base = TOKENS.getBySymbol(rootGetters.pairInfo.base)
    let decimal = base.decimal

    let orderData = Object.assign({}, order)
    orderData.created_at = getShortDate(new Date(orderData.created_at * 1000))
    orderData.price = TOKENS.convertBigIntToFixed(orderData.price, decimal)
    orderData.quantity = TOKENS.convertBigIntToFixed(orderData.quantity, decimal)
    orderData.volume = TOKENS.convertBigIntToFixed(orderData.volume, decimal)
    orderData.volume_filled = TOKENS.convertBigIntToFixed(orderData.volume_filled || '0', decimal)

    commit(COMMIT_ADD_USER_OPEN_ORDER, orderData)
  },
}

const mutations = {
  [COMMIT_USER_PAIR_ORDERS] (state: IMyOrdersState, value) {
    state.data = value
  },
  [COMMIT_ADD_USER_OPEN_ORDER] (state: IMyOrdersState, order) {
    state.data.unshift(order)
  },
}

const getters = {}

export default {
  state,
  actions,
  mutations,
  getters
}