import { USER_PAIR_ORDERS_GETTER } from '@/store/action-types'
import { COMMIT_USER_PAIR_ORDERS } from '@/store/mutation-types'
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
}

const mutations = {
  [COMMIT_USER_PAIR_ORDERS] (state: IMyOrdersState, value) {
    state.data = value
  }
}

const getters = {}

export default {
  state,
  actions,
  mutations,
  getters
}