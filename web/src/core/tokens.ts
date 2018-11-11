import IToken from '@/interfaces/IToken'
import BN from 'bn.js'

let tokenIndexMap = {};
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
          tokenIndexMap[token.s] = index
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
    // console.log(amount, decimals)
    if (amount.length <= decimals) {
      return `0.${amount.padStart(decimals, '0').slice(0, 8)}`
    }

    let offset = amount.length - decimals

    return `${amount.slice(0, offset)}.${amount.slice(offset, 8)}`
  },

  // convertToSmallestTokenUnit (amount: string, symbol: string): string {
  //   let token = this.getBySymbol(symbol)
  //   if (token == null) {
  //     throw new Error("Invalid symbol")
  //   }
  //   let decimal = new BN(token.decimal, 10)
  //   let factor = decimal.pow(new BN(10, 10))
  //   let units = new BN(amount, 10)
    
  //   return units.mul(factor).toString()
  // },

  // convertToNormalTokenUnit (units: string, symbol: string): string {
  //   let token = this.getBySymbol(symbol)
  //   if (token == null) {
  //     throw new Error("Invalid symbol")
  //   }
  //   let decimal = new BN(token.decimal, 10)
  //   let factor = decimal.pow(new BN(10, 10))
  //   let amount = new BN(units, 10)
    
  //   return amount.div(factor).toString()
  // },

}

export default TOKENS