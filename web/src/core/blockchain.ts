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
  isExchange: <boolean> false,
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
  getNetworkInfo(): INetwork {
    if (this.isExchange) {
      return this.NETWORK_INFO!.foreign
    }
    return this.NETWORK_INFO!.home
  },
  getContractInfo(): IContract {
    if (this.isExchange) {
      return this.CONTRACTS_INFO!.foreign
    }
    return this.CONTRACTS_INFO!.home
  },
  getAuthorities(): string[] {
    return this.NETWORK_INFO!.authorities
  }
}

export default BLOCKCHAIN_INFO