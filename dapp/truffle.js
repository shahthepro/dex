module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 4712388,
      gasPrice: 65000000000
    },
    privatenet: {
      host: '127.0.0.1',
      port: 8501,
      network_id: '*',
      gas: 3000000,
      gasPrice: 1
    }
  }
};
