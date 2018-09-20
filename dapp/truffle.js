module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 47123880000,
      gasPrice: 1
    },
    privatenet: {
      host: '127.0.0.1',
      port: 8501,
      network_id: '*',
      gas: 30000000,
      gasPrice: 1
    }
  }
};
