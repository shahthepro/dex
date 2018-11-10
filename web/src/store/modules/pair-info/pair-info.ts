import { TOKEN_PAIR_SETTER } from '@/store/action-types'
import { COMMIT_TOKEN_PAIR } from '@/store/mutation-types'
import tradeForm from './modules/trade-form'

interface IStockChartData {
  time: Date
  open: string
  high: string
  low: string
  close: string
  volume: string
}

interface IOrderMinimal {
  hash: string
  price: string
  amount: string
}

interface IOrder extends IOrderMinimal {
  time: Date
  isBid: Boolean
  filled: string
  total: string
  createdBy: string
}

interface ITradeHistoryData {
  time: Date
  price: string
  volume: string
  isBuy: Boolean
}

interface IOrderbook {
  buyOrders: IOrderMinimal[]
  sellOrders: IOrderMinimal[]
}

interface ITradePairInfo {
  token: string
  base: string
  chartData: IStockChartData[]
  openOrders: IOrder[]
  orderbook: IOrderbook
  tradeHistory: ITradeHistoryData[]
  lastPrice: string
}

const state: ITradePairInfo = {
  token: '',
  base: '',
  chartData: [],
  openOrders: [],
  orderbook: {
    buyOrders: [],
    sellOrders: []
  },
  tradeHistory: [],
  lastPrice: ''
}

const actions = {
  [TOKEN_PAIR_SETTER] ({ commit }, args) {
    commit(COMMIT_TOKEN_PAIR, args)
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
    tradeForm
  }
}
