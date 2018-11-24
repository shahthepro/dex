import IToken from '@/interfaces/IToken'
import BN from 'bn.js'

let tokenIndexMap = {};
let tokenAddressIndexMap = {};
let tokensList = [];

const TOKENS = {
  defaultPair: {
    token: 'TRX',
    base: 'ETH'
  },
  load (): Promise<any> {
    return fetch('/tokens.json')
      .then(resp => resp.json())
      .then(tokens => {
        tokenIndexMap = {}
        tokensList = tokens.map((token, index) => {
          tokenIndexMap[token.s.toUpperCase()] = index
          tokenAddressIndexMap[token.a.toLowerCase()] = index
          return <IToken> {
            symbol: token.s,
            address: token.a,
            decimal: token.d
          }
        })
      })
  },
  getBySymbol (symbol): IToken {
    return tokensList[tokenIndexMap[symbol.toUpperCase()]]
  },
  getByAddress (tokenAddress): IToken {
    return tokensList[tokenAddressIndexMap[tokenAddress.toLowerCase()]]
  },
  get (): IToken[] {
    return tokensList
  },
  getPairs (base: string): string[] {
    let token: IToken
    let pairs: string[] = []
    for (let i = 0; i < tokensList.length; i++) {
      token = tokensList[i]
      if (token.symbol == base) {
        continue
      } else {
        pairs[pairs.length] = `${token.symbol}/${base}`
      }
    }
    return pairs
  },
  isPairValid (tokenSymbol: string, baseSymbol: string): boolean {
    let token: IToken = this.getBySymbol(tokenSymbol)
    let base: IToken = this.getBySymbol(baseSymbol)

    if (base == null || token == null) {
      return false
    }

    // TODO: compare base.address and token.address
    return (base.address < token.address)
  },

  convertBigIntToFixed (amount: string, decimals: number): string {
    if (amount.length <= decimals) {
      return `0.${amount.padStart(decimals, '0').slice(0, 8)}`
    }

    let offset = amount.length - decimals

    return `${amount.slice(0, offset)}.${amount.slice(offset, 8)}`
  },

  convertFixedToBigInt (amount: string, decimals: number): string {
    let s = amount.split('.')
    let whole = s[0]
    let frac = s[1] || ''

    if (frac.length == decimals) {
      return `${whole}${frac}`
    } else if (frac.length < decimals) {
      return `${whole}${frac.padEnd(decimals, '0')}`
    }
    return ''
  },

}

export default TOKENS