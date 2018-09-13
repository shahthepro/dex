import { TOKENS_NAMESPACE } from '@/core/constants'
import IToken from '@/interfaces/itoken'

let tokenIndexMap = {};

const TOKENS = {
  defaultPair: {
    token: 'TRX',
    base: 'ETH'
  },
  load () {
    return fetch('/tokens.json')
      .then(resp => resp.json())
      .then(tokens => {
        tokenIndexMap = {}
        // @ts-ignore
        window[TOKENS_NAMESPACE] = tokens.map((token, index) => {
          tokenIndexMap[token.s] = index
          return <IToken> {
            symbol: token.s,
            address: token.a,
            decimal: token.d
          }
        })
      })
  },
  get () {
    // @ts-ignore
    return window[TOKENS_NAMESPACE]
  },
  getPairs (base: string) {
    let token: IToken
    let pairs: string[] = []
    // @ts-ignore
    for (let i = 0; i < window[TOKENS_NAMESPACE].length; i++) {
      // @ts-ignore
      token = window[TOKENS_NAMESPACE][i]
      if (token.symbol == base) {
        continue
      } else {
        pairs[pairs.length] = `${token.symbol}/${base}`
      }
    }
    return pairs
  },
  isPairValid (tokenSymbol: string, baseSymbol: string) {
    // let token: IToken
    // let base: IToken
    // let temp: IToken
    // // @ts-ignore
    // for (let i = 0; i < window[TOKENS_NAMESPACE].length; i++) {
    //   // @ts-ignore
    //   temp = window[TOKENS_NAMESPACE][i]
    //   if (temp.symbol == baseSymbol) {
    //     base = temp
    //   } else if (temp.symbol == tokenSymbol) {
    //     token = temp
    //   } else {
    //     continue
    //   }

    //   // @ts-ignore
    //   if (base != null && token != null) {
    //     break
    //   }
    // }

    let token: IToken = window[TOKENS_NAMESPACE][tokenIndexMap[tokenSymbol]];
    let base: IToken = window[TOKENS_NAMESPACE][tokenIndexMap[baseSymbol]];

    // @ts-ignore
    if (base == null || token == null) {
      return false
    }

    // TODO: compare base.address and token.address
    return (base.address < token.address)
  }
}

export default TOKENS