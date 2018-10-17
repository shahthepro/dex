module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 5000000000000000,
      gasPrice: 1
    },
    privatenet: {
      host: '127.0.0.1',
      port: 8501,
      network_id: '*',
      gas: 30000000,
      gasPrice: 1
    },
    paritynet: {
      host: '127.0.0.1',
      port: 8540,
      network_id: '*',
      gas: 47322120,
      gasPrice: 1,
      from: "0x105df82ed385b6551ba0ee83819ad49537da234c"
    }
  },
  // solc: {
  //   optimizer: { // Turning on compiler optimization that removes some local variables during compilation
  //     enabled: true,
  //     runs: 200
  //   }
  // }
};
