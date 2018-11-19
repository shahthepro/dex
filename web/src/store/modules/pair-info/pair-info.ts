import { TOKEN_PAIR_SETTER, OHLC_CHARTDATA_GETTER, TRADE_HISTORY_GETTER, PAIR_ORDERBOOK_GETTER, USER_PAIR_ORDERS_GETTER, SOCKET_SERVER_DIALER, SOCKET_SERVER_CLOSER } from '@/store/action-types'
import { COMMIT_TOKEN_PAIR, COMMIT_CONNECT_SOCKET_SERVER, COMMIT_DISCONNECT_SOCKET_SERVER } from '@/store/mutation-types'
import tradeForm from './modules/trade-form'
import chartData from './modules/chart-data'
import tradeHistory from './modules/trade-history'
import orderbook from './modules/orderbook'
import myOrders from '@/store/modules/pair-info/modules/open-orders'
import TOKENS from '@/core/tokens';

interface ITradePairInfo {
  token: string
  base: string
  socketConnected: boolean
  socketInstance: WebSocket|null
}

const state: ITradePairInfo = {
  token: '',
  base: '',
  socketConnected: false,
  socketInstance: null
}

const actions = {
  async [TOKEN_PAIR_SETTER] ({ commit, dispatch, rootGetters }, args) {
    commit(COMMIT_TOKEN_PAIR, args)
    dispatch(SOCKET_SERVER_DIALER, args)
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
  [SOCKET_SERVER_DIALER] ({ commit }, args) {
	  let token = TOKENS.getBySymbol(args.token)
    let base = TOKENS.getBySymbol(args.base)
    
    let socketInstance = new WebSocket(`ws://localhost:7424/ws/${token.address}/${base.address}`)

    socketInstance.onopen = function () {
      commit(COMMIT_CONNECT_SOCKET_SERVER, { socketInstance })
    }

    socketInstance.onclose = function () {
      commit(COMMIT_DISCONNECT_SOCKET_SERVER)
    }

    socketInstance.onmessage = function (message) {
      console.log(message)
    }

  },
  [SOCKET_SERVER_CLOSER] ({ commit }) {
    if (state.socketConnected && state.socketInstance && state.socketInstance.readyState <= 1) {
      state.socketInstance!.close()
    }
    commit(COMMIT_DISCONNECT_SOCKET_SERVER)
  },
}

const mutations = {
  [COMMIT_TOKEN_PAIR] (state, args) {
    state.base = args.base
    state.token = args.token
  },
  [COMMIT_CONNECT_SOCKET_SERVER] (state, { socketInstance }) {
    state.socketConnected = true
    state.socketInstance = socketInstance
  },
  [COMMIT_DISCONNECT_SOCKET_SERVER] (state) {
    state.socketConnected = false
    state.socketInstance = null
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
