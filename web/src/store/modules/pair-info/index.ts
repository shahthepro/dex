import BigNumber from 'bn.js'

import { TOKEN_PAIR_SETTER, TRADEFORM_PRICE_SETTER, TRADEFORM_SIDE_SETTER, TRADEFORM_AMOUNT_SETTER } from '@/store/action-types'
import { COMMIT_TOKEN_PAIR, COMMIT_TRADEFORM_PRICE, COMMIT_TRADEFORM_SIDE, COMMIT_TRADEFORM_AMOUNT } from '@/store/mutation-types'

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

interface ITradeForm {
  side: number,
  price: string,
  amount: string
}

interface ITradePairInfo {
  token: string
  base: string
  chartData: IStockChartData[]
  openOrders: IOrder[]
  orderbook: IOrderbook
  tradeHistory: ITradeHistoryData[]
  lastPrice: BigNumber,
  tradeForm: ITradeForm
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
  lastPrice: new BigNumber(0, 10),
  tradeForm: {
    side: 0,
    price: '',
    amount: ''
  }
}

const actions = {
  [TOKEN_PAIR_SETTER] ({ commit }, args) {
    commit(COMMIT_TOKEN_PAIR, args)
  },
  [TRADEFORM_PRICE_SETTER] ({ commit }, value) {
    commit(COMMIT_TRADEFORM_PRICE, value)
  },
  [TRADEFORM_AMOUNT_SETTER] ({ commit }, value) {
    commit(COMMIT_TRADEFORM_AMOUNT, value)
  },
  [TRADEFORM_SIDE_SETTER] ({ commit }, value) {
    commit(COMMIT_TRADEFORM_SIDE, value)
  },
}

const mutations = {
  [COMMIT_TOKEN_PAIR] (state, args) {
    state.base = args.base
    state.token = args.token
  },
  [COMMIT_TRADEFORM_PRICE] (state, value) {
    state.tradeForm.price = value
  },
  [COMMIT_TRADEFORM_AMOUNT] (state, value) {
    state.tradeForm.amount = value
  },
  [COMMIT_TRADEFORM_SIDE] (state, value) {
    state.tradeForm.side = value
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