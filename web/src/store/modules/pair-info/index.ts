import { TOKEN_PAIR_SETTER, TRADEFORM_PRICE_SETTER, TRADEFORM_SIDE_SETTER, TRADEFORM_AMOUNT_SETTER } from '@/store/action-types'
import { COMMIT_TOKEN_PAIR, COMMIT_TRADEFORM_PRICE, COMMIT_TRADEFORM_SIDE, COMMIT_TRADEFORM_AMOUNT } from '@/store/mutation-types'

interface IStockChartData {
  time: Date
  open: string
  high: string
  low: string
  close: string
  volume: string
}

interface IOrderMinimal {
  hash: String
  price: string
  amount: string
}

interface IOrder extends IOrderMinimal {
  time: Date
  isBid: Boolean
  filled: string
  total: string
  createdBy: String
}

interface ITradeHistoryData {
  time: Date
  price: string
  quantity: string
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
  lastPrice: string,
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
  lastPrice: '',
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

  // Trade form two-way binding
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

  // Trade form two-way binding
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