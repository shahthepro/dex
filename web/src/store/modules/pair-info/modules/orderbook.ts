import { PAIR_ORDERBOOK_GETTER, ADD_ORDERBOOK_ORDER, CANCEL_ORDERBOOK_ORDER, FILL_ORDERBOOK_ORDER } from '@/store/action-types'
import { COMMIT_PAIR_ORDERBOOK, COMMIT_ORDERBOOK_LAST_PRICE, COMMIT_ORDERBOOK_ASKS, COMMIT_ORDERBOOK_BIDS } from '@/store/mutation-types'
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

}

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
  [ADD_ORDERBOOK_ORDER] ({ state, commit, rootGetters }, { order }) {
	  let base = TOKENS.getBySymbol(rootGetters.pairInfo.base)
    let decimal = base.decimal

    let orders;
    if (order.is_bid) {
      orders = JSON.parse(JSON.stringify(state.bids))
    } else {
      orders = JSON.parse(JSON.stringify(state.asks))
    }
    
    let price = TOKENS.convertBigIntToFixed(order.price, decimal)
    let volume = TOKENS.convertBigIntToFixed(order.volume, decimal)

    let priceMatchFound = false;
    for (let i = 0; i < orders.length; i++) {
      let orderAtI = orders[i]
      if (!priceMatchFound && orderAtI.price == price) {
        priceMatchFound = true;
        let newVol = parseFloat((parseFloat(orderAtI.volume) + parseFloat(volume)).toFixed(8)).toString();
        orders[i].volume = newVol
        break;
      }
    }

    if (!priceMatchFound) {
      orders.push({
        price,
        volume,
        volume_filled: 0
      })

      orders = orders.sort((o1, o2) => {
        return o2.price - o1.price
      })
    }

    if (order.is_bid) {
      commit(COMMIT_ORDERBOOK_BIDS, orders)
    } else {
      commit(COMMIT_ORDERBOOK_ASKS, orders)
    }
    
  },
  [CANCEL_ORDERBOOK_ORDER] ({ state, commit, rootGetters }, { order }) {
    //
  },
  [FILL_ORDERBOOK_ORDER] ({ state, commit, rootGetters }, { order }) {
	  // let base = TOKENS.getBySymbol(rootGetters.pairInfo.base)
    // let decimal = base.decimal

    // let orders;
    // if (order.is_bid) {
    //   orders = JSON.parse(JSON.stringify(state.bids))
    // } else {
    //   orders = JSON.parse(JSON.stringify(state.asks))
    // }
    
    // let price = TOKENS.convertBigIntToFixed(order.price, decimal)
    // let volume = TOKENS.convertBigIntToFixed(order.volume, decimal)
    // let volumeFilled = TOKENS.convertBigIntToFixed(order.volume_filled, decimal)

    // let removeIndex = -1;
    // for (let i = 0; i < orders.length; i++) {
    //   // let orderAtI = orders[i]
    //   if (orders[i].price == price) {
    //     if (order.is_open) {
    //       //
    //     } else {
    //       let newOrderbookVolume = parseFloat(orders[i].volume) - parseFloat(order.volume)
    //       if (newOrderbookVolume == 0) {
    //         removeIndex = i
    //         break
    //       }
    //       orders[i].volume = parseFloat(newOrderbookVolume.toFixed(8).toString())
    //     }
    //   //   let newVolumeFilled = parseFloat(orderAtI.volume_filled) + parseFloat(volumeFilled) // .toFixed(8)).toString();
    //   //   let volume = parseFloat(orderAtI.volume) // .toFixed(8)).toString();
    //   //   if (newVolumeFilled == volume) {
    //   //     removeIndex = i;
    //   //   } else {
    //   //     orders[i].volume_filled = parseFloat(newVolumeFilled.toFixed(8).toString())
    //   //   }
    //   //   break;
    //   }
    // }

    // if (removeIndex >= 0) {
    //   orders.splice(removeIndex, 1)
    // }

    // if (order.is_bid) {
    //   commit(COMMIT_ORDERBOOK_BIDS, orders)
    // } else {
    //   commit(COMMIT_ORDERBOOK_ASKS, orders)
    // }
  },
}

const mutations = {
  [COMMIT_PAIR_ORDERBOOK] (state: IOrderbookState, value) {
    state.asks = value.asks
    state.bids = value.bids
    state.last_price = value.last_price
  },
  [COMMIT_ORDERBOOK_LAST_PRICE] (state: IOrderbookState, value) {
    state.last_price = value
  },
  [COMMIT_ORDERBOOK_ASKS] (state: IOrderbookState, value) {
    state.asks = value
  },
  [COMMIT_ORDERBOOK_BIDS] (state: IOrderbookState, value) {
    state.bids = value
  },
}

const getters = {}

export default {
  state,
  actions,
  mutations,
  getters
}