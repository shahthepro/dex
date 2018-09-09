import { TOKENS as TOKENS_NAMESPACE } from '@/core/constants'
import IToken from '@/interfaces/itoken'

const TOKENS = {
  defaultPair: {
    token: 'TRX',
    base: 'ETH'
  },
  load () {
    return fetch('/tokens.json')
      .then(resp => resp.json())
      .then(tokens => {
        // @ts-ignore
        window[TOKENS_NAMESPACE] = tokens.map(token => {
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
    let token: IToken
    let base: IToken
    let temp: IToken
    // @ts-ignore
    for (let i = 0; i < window[TOKENS_NAMESPACE].length; i++) {
      // @ts-ignore
      temp = window[TOKENS_NAMESPACE][i]
      if (temp.symbol == baseSymbol) {
        base = temp
      } else if (temp.symbol == tokenSymbol) {
        token = temp
      } else {
        continue
      }

      // @ts-ignore
      if (base != null && token != null) {
        break
      }
    }

    // @ts-ignore
    if (base == null || token == null) {
      return false
    }

    // TODO: compare base.address and token.address

    return true
  }
}

export default TOKENS