import { ALL_USER_TRADES_GETTER } from '@/store/action-types'
import { COMMIT_USER_TRADE_HISTORY } from '@/store/mutation-types'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service'
import { getShortDate } from '@/utils/general';

interface ITrade {

}

interface IUserTradeHistoryState {
  data: ITrade[]

}

const state = <IUserTradeHistoryState>{
  data: []
}

const actions = {
  [ALL_USER_TRADES_GETTER]({ commit }, args: any) {
    if (args.walletAddress == null) {
      commit(COMMIT_USER_TRADE_HISTORY, [])
      return
    }

    APIService.getAllOpenOrders(args.walletAddress)
      // .then(data => {

      //   for (let i = 0, len = data.length; i < len; i++) {
      //     let token = TOKENS.getByAddress(data[i].token)
      //     let base = TOKENS.getByAddress(data[i].base)
      //     let decimal = base.decimal

      //     data[i].created_at = getShortDate(new Date(data[i].created_at * 1000))
      //     data[i].price = TOKENS.convertBigIntToFixed(data[i].price, decimal)
      //     data[i].quantity = TOKENS.convertBigIntToFixed(data[i].quantity, decimal)
      //     data[i].volume = TOKENS.convertBigIntToFixed(data[i].volume, decimal)
      //     data[i].volume_filled = TOKENS.convertBigIntToFixed(data[i].volume_filled, decimal)
      //   }

      //   commit(COMMIT_USER_TRADE_HISTORY, data)
      // })
  },
}

const mutations = {
  [COMMIT_USER_TRADE_HISTORY](state: IUserTradeHistoryState, value) {
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