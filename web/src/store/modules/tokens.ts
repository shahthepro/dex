import IToken from '@/interfaces/itoken'
import { LOAD, GET, TOKEN_PAIRS_GETTER } from '@/store/action-types'
import { SUCCESS } from '@/store/mutation-types'

const state = {
  tokens: <IToken[]> [],
  defaultBase: <string> 'ETH'
}

const actions = {
  async [LOAD] ({ commit }) {
    const response = await fetch('/tokens.json')
    let tokens = await response.json()
    tokens = tokens.map(token => {
      return <IToken> {
        symbol: token.s,
        address: token.a,
        decimal: token.d
      }
    })
    commit(SUCCESS, tokens)
  }
}

const mutations = {
  [SUCCESS] (state, tokens) {
    state.tokens = tokens
  }
}

const getters = {
  [GET] (state) {
    return state.tokens
  },
  // [TOKEN_PAIRS_GETTER] (state) {
  //   let pairs: string[] = []

  //   let token: IToken
  //   for (let i = 0; i < pairs.length; i++) {
  //     token = state.tokens[i]
  //     if (token.symbol == state.defaultBase) {
  //       continue
  //     } else {
  //       pairs[pairs.length] = `${token.symbol}/${state.defaultBase}`
  //     }
  //   }

  //   return pairs
  // }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
