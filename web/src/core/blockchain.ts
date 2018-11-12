interface IContract {
  network: number,
  address: string,
  topics?: any
}

interface IContractsInfo {
  bridge: IContract
  exchange: IContract
  orderbook: IContract
}

interface INetwork {
  provider: string,
  wsProvider?: string,
  requiredSignatures: number,
  makeFee?: string,
  takeFee?: string,
  cancelFee?: string,
}

interface INetworkInfo {
  bridge: INetwork,
  exchange: INetwork,
  authorities: string[],
}

const BLOCKCHAIN_INFO = {
  CONTRACTS_INFO: <IContractsInfo|null> null,
  NETWORK_INFO: <INetworkInfo|null> null,
  BRIDGE_CONTRACT_ABI: <any> null,
  EXCHANGE_CONTRACT_ABI: <any> null,
  ORDERBOOK_CONTRACT_ABI: <any> null,
  isExchange: <boolean> false,
  load ({ forExchange }) {
    fetch('/contracts.g.json')
      .then(resp => resp.json())
      .then(contracts => {
        this.CONTRACTS_INFO = Object.freeze(contracts)
      });
      
    fetch('/network.json')
      .then(resp => resp.json())
      .then(networks => {
        this.NETWORK_INFO = Object.freeze(networks)
      });
      
    if (forExchange === true) {
      this.isExchange = true
      fetch('/abi/DEXChain.json')
        .then(resp => resp.json())
        .then(contractABI => {
          this.EXCHANGE_CONTRACT_ABI = Object.freeze(contractABI)
        })
      fetch('/abi/Orderbook.json')
        .then(resp => resp.json())
        .then(contractABI => {
          this.ORDERBOOK_CONTRACT_ABI = Object.freeze(contractABI)
        })
    } else {
      this.isExchange = false
      fetch('/abi/HomeBridge.json')
        .then(resp => resp.json())
        .then(contractABI => {
          this.BRIDGE_CONTRACT_ABI = Object.freeze(contractABI)
        })
    }
  },
  getNetworkInfo(): INetwork {
    if (this.isExchange) {
      return this.NETWORK_INFO!.exchange
    }
    return this.NETWORK_INFO!.bridge
  },
  getBridgeContractInfo(): IContract {
    return this.CONTRACTS_INFO!.bridge
  },
  getExchangeContractInfo(): IContract {
    return this.CONTRACTS_INFO!.exchange
  },
  getOrderbookContractInfo(): IContract {
    return this.CONTRACTS_INFO!.orderbook
  },
  getBridgeABI() {
    return this.BRIDGE_CONTRACT_ABI
  },
  getExchangeABI() {
    return this.EXCHANGE_CONTRACT_ABI
  },
  getOrderbookABI() {
    return this.ORDERBOOK_CONTRACT_ABI
  },
  getAuthorities(): string[] {
    return this.NETWORK_INFO!.authorities
  }
}

export default BLOCKCHAIN_INFO