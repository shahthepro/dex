import BigNumber from 'bn.js'

import { TOKEN_PAIR_SETTER } from '@/store/action-types'
import { COMMIT_TOKEN_PAIR } from '@/store/mutation-types'

interface IStockChartData {
  time: Date
  open: BigNumber
  high: BigNumber
  low: BigNumber
  close: BigNumber
  volume: BigNumber
}

interface IOrderMinimal {
  hash: String
  price: BigNumber
  amount: BigNumber
}

interface IOrder extends IOrderMinimal {
  time: Date
  isBid: Boolean
  filled: BigNumber
  total: BigNumber
  createdBy: String
}

interface ITradeHistoryData {
  time: Date
  price: BigNumber
  quantity: BigNumber
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
  lastPrice: BigNumber
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
  lastPrice: new BigNumber(0)
}

const actions = {
  [TOKEN_PAIR_SETTER] ({ commit }, args) {
    commit(COMMIT_TOKEN_PAIR, args)
  }
}

const mutations = {
  [COMMIT_TOKEN_PAIR] (state, args) {
    state.base = args.base
    state.token = args.token
  }
}

const getters = {}

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
}