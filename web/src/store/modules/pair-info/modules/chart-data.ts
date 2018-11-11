import { OHLC_CHARTDATA_GETTER } from '@/store/action-types'
import { COMMIT_OHLC_CHARTDATA } from '@/store/mutation-types'
import IOHLCData from '@/interfaces/IOHLCData'
import TOKENS from '@/core/tokens'
import APIService from '@/core/api-service'

interface IChartDataState {
	data: IOHLCData[]
};

const state = <IChartDataState> {
	data: []
}

const actions = {
  [OHLC_CHARTDATA_GETTER] ({ commit }, args: any) {
	  let token = TOKENS.getBySymbol(args.token)
	  let base = TOKENS.getBySymbol(args.base)
    
    APIService.getOHLCData(token.address, base.address)
      .then(data => {

        let decimal = base.decimal
        
        for (let i = 0, len = data.length; i < len; i++) {
          data[i].open = TOKENS.convertBigIntToFixed(data[i].open, decimal)
          data[i].high = TOKENS.convertBigIntToFixed(data[i].high, decimal)
          data[i].low = TOKENS.convertBigIntToFixed(data[i].low, decimal)
          data[i].close = TOKENS.convertBigIntToFixed(data[i].close, decimal)
          data[i].volume = TOKENS.convertBigIntToFixed(data[i].volume, decimal)
        }

        commit(COMMIT_OHLC_CHARTDATA, data)
      })
  },
}

const mutations = {
  [COMMIT_OHLC_CHARTDATA] (state: IChartDataState, value) {
    state.data = value
  }
}

const getters = {}

export default {
  state,
  actions,
  mutations,
  getters
}