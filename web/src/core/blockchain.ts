interface IContract {
  network: number,
  address: string,
  topics?: any
}

interface IContractsInfo {
  home: IContract,
  foreign: IContract
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
  load () {
    let contracts = fetch('/contracts.g.json')
      .then(resp => resp.json())
      .then(contracts => {
        this.CONTRACTS_INFO = contracts; 
      });
      
    let network = fetch('/network.json')
      .then(resp => resp.json())
      .then(contracts => {
        this.NETWORK_INFO = contracts; 
      });
      
    return [contracts, network]
  },
  getHomeNetworkInfo(): INetwork {
    return this.NETWORK_INFO!.home
  },
  getHomeContractInfo(): IContract {
    return this.CONTRACTS_INFO!.home
  },
  getExchangeNetworkInfo(): INetwork {
    return this.NETWORK_INFO!.foreign
  },
  getExchangeContractInfo(): IContract {
    return this.CONTRACTS_INFO!.foreign
  },
  getAuthorities(): string[] {
    return this.NETWORK_INFO!.authorities
  }
}

export default BLOCKCHAIN_INFO