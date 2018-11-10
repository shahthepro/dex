import { TOKEN_PAIR_SETTER, FETCH_OHLC_CHARTDATA, OHLC_CHARTDATA_GETTER } from '@/store/action-types'
import { COMMIT_TOKEN_PAIR } from '@/store/mutation-types'
import tradeForm from './modules/trade-form'
import chartData from './modules/chart-data'
import BN from 'bn.js'

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
  price: BN|string
  amount: BN|string
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
}

interface IOrderbook {
  bids: IOrderMinimal[]
  asks: IOrderMinimal[]
  lastPrice: BN|null
}

interface ITradePairInfo {
  token: string
  base: string
  // chartData: IStockChartData[]
  openOrders: IOrder[]
  orderbook: IOrderbook
  tradeHistory: ITradeHistoryData[]
  lastPrice: string
}

const state: ITradePairInfo = {
  token: '',
  base: '',
  // chartData: [],
  openOrders: [],
  orderbook: {
    bids: [],
    asks: [],
    lastPrice: null
  },
  tradeHistory: [],
  lastPrice: ''
}

const actions = {
  async [TOKEN_PAIR_SETTER] ({ commit, dispatch }, args) {
    commit(COMMIT_TOKEN_PAIR, args)
    dispatch(OHLC_CHARTDATA_GETTER, args)
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
    chartData
  }
}
