import BigNumber from 'bn.js'

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
  token: IToken
  base: IToken
  chartData: IStockChartData[]
  openOrders: IOrder[]
  orderbook: IOrderbook
  tradeHistory: ITradeHistoryData[]
  lastPrice: BigNumber
}

interface IToken {
  type?: number
  symbol: string
  name?: string
  decimal: string
  address: string
}

interface IExchangeState {
  tradePairInfo?: ITradePairInfo
  tokens?: IToken[]
}

let state: IExchangeState = {}

export default state