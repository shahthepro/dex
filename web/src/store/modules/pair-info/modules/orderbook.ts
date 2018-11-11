import { PAIR_ORDERBOOK_GETTER } from '@/store/action-types'
import { COMMIT_PAIR_ORDERBOOK } from '@/store/mutation-types'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service'

interface IOrderbookEntry {
  price: string
  volume: string
  volume_filled: string
}

interface IOrderbookState {
  asks: IOrderbookEntry[]
  bids: IOrderbookEntry[]
  last_price: string

};

const state = <IOrderbookState> {
  asks: [],
  bids: [],
  last_price: ''
}

const actions = {
  [PAIR_ORDERBOOK_GETTER] ({ commit }, args: any) {
	  let token = TOKENS.getBySymbol(args.token)
	  let base = TOKENS.getBySymbol(args.base)
    
    APIService.getOrderbook(token.address, base.address)
      .then(data => {

        let decimal = base.decimal

        data.last_price = TOKENS.convertBigIntToFixed(data.last_price, decimal)

        let asks = data.asks.reverse()
        for (let i = 0, len = asks.length; i < len; i++) {
          asks[i].price = TOKENS.convertBigIntToFixed(asks[i].price, decimal)
          asks[i].volume = TOKENS.convertBigIntToFixed(asks[i].volume, decimal)
          asks[i].volume_filled = TOKENS.convertBigIntToFixed(asks[i].volume_filled, decimal)
        }
        data.asks = asks

        for (let i = 0, bids = data.bids, len = bids.length; i < len; i++) {
          bids[i].price = TOKENS.convertBigIntToFixed(bids[i].price, decimal)
          bids[i].volume = TOKENS.convertBigIntToFixed(bids[i].volume, decimal)
          bids[i].volume_filled = TOKENS.convertBigIntToFixed(bids[i].volume_filled, decimal)
        }

        commit(COMMIT_PAIR_ORDERBOOK, data)
      })
  },
}

const mutations = {
  [COMMIT_PAIR_ORDERBOOK] (state: IOrderbookState, value) {
    state.asks = value.asks
    state.bids = value.bids
    state.last_price = value.last_price
  }
}

const getters = {}

export default {
  state,
  actions,
  mutations,
  getters
}