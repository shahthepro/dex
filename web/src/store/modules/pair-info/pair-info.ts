import { TOKEN_PAIR_SETTER, OHLC_CHARTDATA_GETTER, TRADE_HISTORY_GETTER, PAIR_ORDERBOOK_GETTER, USER_PAIR_ORDERS_GETTER } from '@/store/action-types'
import { COMMIT_TOKEN_PAIR } from '@/store/mutation-types'
import tradeForm from './modules/trade-form'
import chartData from './modules/chart-data'
import tradeHistory from './modules/trade-history'
import orderbook from './modules/orderbook'
import myOrders from './modules/my-orders'

interface ITradePairInfo {
  token: string
  base: string
}

const state: ITradePairInfo = {
  token: '',
  base: '',
}

const actions = {
  async [TOKEN_PAIR_SETTER] ({ commit, dispatch, rootGetters }, args) {
    commit(COMMIT_TOKEN_PAIR, args)
    dispatch(OHLC_CHARTDATA_GETTER, args)
    dispatch(TRADE_HISTORY_GETTER, args)
    dispatch(PAIR_ORDERBOOK_GETTER, args)
    if (rootGetters.wallet.isConnected) {
      dispatch(USER_PAIR_ORDERS_GETTER, {
        ...args,
        walletAddress: rootGetters.wallet.current.address
      })
    }
  },
}

const mutations = {
  [COMMIT_TOKEN_PAIR] (state, args) {
    state.base = args.base
    state.token = args.token
  },
}

const getters = {}

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters,
  modules: {
    tradeForm,
    chartData,
    tradeHistory,
    orderbook,
    myOrders
  }
}
