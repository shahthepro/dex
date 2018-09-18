interface IContract {
  network: number,
  address: string,
  topics?: any
}

interface IContractsInfo {
  bridge: IContract,
  exchange: IContract
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
  home: INetwork,
  foreign: INetwork,
  authorities: string[],
}

const BLOCKCHAIN_INFO = {
  CONTRACTS_INFO: <IContractsInfo|null> null,
  NETWORK_INFO: <INetworkInfo|null> null,
  CONTRACT_ABI: <any> null,
  isExchange: <boolean> false,
  load (forExchange) {
    let contracts = fetch('/contracts.g.json')
      .then(resp => resp.json())
      .then(contracts => {
        this.CONTRACTS_INFO = Object.freeze(contracts)
      });
      
    let network = fetch('/network.json')
      .then(resp => resp.json())
      .then(networks => {
        this.NETWORK_INFO = Object.freeze(networks)
      });
      
    let abi
    if (forExchange === true) {
      this.isExchange = true
      abi = fetch('/abi/Exchange.json')
    } else {
      this.isExchange = false
      abi = fetch('/abi/HomeBridge.json')
    }

    abi
      .then(resp => resp.json())
      .then(contractABI => {
        this.CONTRACT_ABI = Object.freeze(contractABI)
      })

    return [contracts, network, abi]
  },
  getNetworkInfo(): INetwork {
    if (this.isExchange) {
      return this.NETWORK_INFO!.foreign
    }
    return this.NETWORK_INFO!.home
  },
  getContractInfo(): IContract {
    if (this.isExchange) {
      return this.CONTRACTS_INFO!.exchange
    }
    return this.CONTRACTS_INFO!.bridge
  },
  getABI() {
    return this.CONTRACT_ABI
  },
  getAuthorities(): string[] {
    return this.NETWORK_INFO!.authorities
  }
}

export default BLOCKCHAIN_INFO