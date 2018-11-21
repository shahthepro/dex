import { TRADE_HISTORY_GETTER, TRADE_HISTORY_APPENDER } from '@/store/action-types'
import { COMMIT_TRADE_HISTORY, COMMIT_NEW_TRADE, COMMIT_ORDERBOOK_LAST_PRICE } from '@/store/mutation-types'
import ITradeHistory from '@/interfaces/ITradeHistory'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service'
import { getShortDate } from '@/utils/general'

interface ITradeHistoryState {
	data: ITradeHistory[]
};

const state = <ITradeHistoryState> {
	data: []
}

const actions = {
  [TRADE_HISTORY_GETTER] ({ commit }, args: any) {
	  let token = TOKENS.getBySymbol(args.token)
	  let base = TOKENS.getBySymbol(args.base)
    
    APIService.getTradeHistory(token.address, base.address)
      .then(data => {
        
        let decimal = base.decimal

        for (let i = data.length - 1, last = data.length - 1; i >= 0; i--) {
          data[i].traded_at = getShortDate(new Date(data[i].traded_at))
          data[i].price = TOKENS.convertBigIntToFixed(data[i].price, decimal)
          data[i].volume = TOKENS.convertBigIntToFixed(data[i].volume, decimal)
          data[i].trend = i == last || data[i].price >= data[i + 1].price
        }

        commit(COMMIT_TRADE_HISTORY, data)
      })
  },
  [TRADE_HISTORY_APPENDER] ({ state, commit, rootGetters }, { trade }) {
	  let base = TOKENS.getBySymbol(rootGetters.pairInfo.base)
    let decimal = base.decimal

    let price = TOKENS.convertBigIntToFixed(trade.price, decimal)

    let trend = true
    if (state.data.length > 0 && state.data[0].price > price) {
      trend = false
    }

    let newTradeData = {
      traded_at: getShortDate(new Date(trade.traded_at * 1000)),
      price,
      volume: TOKENS.convertBigIntToFixed(trade.volume, decimal),
      trend,
    }

    commit(COMMIT_NEW_TRADE, newTradeData)
    commit(COMMIT_ORDERBOOK_LAST_PRICE, price)
  },
}

const mutations = {
  [COMMIT_TRADE_HISTORY] (state: ITradeHistoryState, value) {
    state.data = value
  },
  [COMMIT_NEW_TRADE] (state: ITradeHistoryState, newTradeData) {
    state.data.unshift(newTradeData)
  },
}

const getters = {}

export default {
  state,
  actions,
  mutations,
  getters
}