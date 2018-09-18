import IToken from '@/interfaces/itoken'

let tokenIndexMap = {};
let tokensList = [];

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
    return tokensList[tokenIndexMap[symbol]]
  },
  get (): IToken[] {
    return tokensList
  },
  getPairs (base: string) {
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
  isPairValid (tokenSymbol: string, baseSymbol: string) {
    let token: IToken = this.getBySymbol(tokenSymbol)
    let base: IToken = this.getBySymbol(baseSymbol)

    if (base == null || token == null) {
      return false
    }

    // TODO: compare base.address and token.address
    return (base.address < token.address)
  }
}

export default TOKENS