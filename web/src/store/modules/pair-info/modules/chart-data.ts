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
  async [OHLC_CHARTDATA_GETTER] ({ commit }, args: any) {
	  let token = TOKENS.getBySymbol(args.token)
	  let base = TOKENS.getBySymbol(args.base)
    
    APIService.getOHLCData(token.address, base.address)
      .then(data => {

        let decimal = base.decimal
        data = data.map(r => {
          return {
            date: r.date,
            open: TOKENS.convertBigIntToFixed(r.open, decimal),
            high: TOKENS.convertBigIntToFixed(r.high, decimal),
            low: TOKENS.convertBigIntToFixed(r.low, decimal),
            close: TOKENS.convertBigIntToFixed(r.close, decimal),
            volume: TOKENS.convertBigIntToFixed(r.volume, decimal),
          }
        })

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