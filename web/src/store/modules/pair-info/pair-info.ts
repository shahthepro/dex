import { TOKEN_PAIR_SETTER, OHLC_CHARTDATA_GETTER, TRADE_HISTORY_GETTER, PAIR_ORDERBOOK_GETTER, USER_PAIR_ORDERS_GETTER, SOCKET_SERVER_DIALER, SOCKET_SERVER_CLOSER, CONNECT_SOCKET_SERVER, DISCONNECT_SOCKET_SERVER, APPEND_TRADE_HISTORY, TRADE_HISTORY_APPENDER, ADD_ORDERBOOK_ORDER, CANCEL_ORDERBOOK_ORDER, FILL_ORDERBOOK_ORDER, PAIR_ORDERS_ORDER_REMOVER, ADD_OPENORDER_ORDER, FILL_OPENORDER_ORDER } from '@/store/action-types'
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

interface ISocketMessage {
  messageType: "TRADE"|"NEW_ORDER"|"CANCEL_ORDER"|"ORDER_FILL"
  messageContent: any
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
  async [SOCKET_SERVER_DIALER] ({ commit, dispatch, rootGetters }, args) {
    await dispatch(SOCKET_SERVER_CLOSER)

	  let token = TOKENS.getBySymbol(args.token)
    let base = TOKENS.getBySymbol(args.base)
    let wallet = rootGetters.wallet;
    
    let socketInstance = new WebSocket(`ws://localhost:7424/ws/${token.address}/${base.address}`)

    socketInstance.onopen = function () {
      commit(COMMIT_CONNECT_SOCKET_SERVER, { socketInstance })
    }

    socketInstance.onmessage = function (message) {
      let data = <ISocketMessage>JSON.parse(message.data)
      let content = data.messageContent

      switch (data.messageType) {
        case "TRADE":
          dispatch(TRADE_HISTORY_APPENDER, { trade: content })
          break

        case "NEW_ORDER":
          dispatch(ADD_ORDERBOOK_ORDER, { order: content })
          if (wallet.isConnected && wallet.current.address.toLowerCase() == content.created_by.toLowerCase()) {
            dispatch(ADD_OPENORDER_ORDER, content)
          }
          break

        case "CANCEL_ORDER":
          dispatch(CANCEL_ORDERBOOK_ORDER, { order: content })
          if (wallet.isConnected && wallet.current.address.toLowerCase() == content.created_by.toLowerCase()) {
            dispatch(PAIR_ORDERS_ORDER_REMOVER, { orderHash: content.order_hash })
          }
          break

        case "ORDER_FILL":
          dispatch(FILL_ORDERBOOK_ORDER, { order: content })
          if (wallet.isConnected && wallet.current.address.toLowerCase() == content.created_by.toLowerCase()) {
            dispatch(FILL_OPENORDER_ORDER, content)
          }
          break
      }
    }
  },
  async [SOCKET_SERVER_CLOSER] ({ commit }) {
    if (state.socketInstance) {
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
