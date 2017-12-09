module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id
            gasPrice: 1e11,
            gas: 4700000,
            from: '0x0accf5cad48eb7516c80ac199511622bcf3958e5'
        },
        privateChain: {
            host: "localhost",
            port: 10004,
            network_id: "*",
            gasPrice: 1e11,
            gas: 4700000,
            from: 'cdbeba354b8ade195a9467c9b56da19bffaf7dc9'
        },
        testNet: {
            host: "localhost",
            port: 8566,
            network_id: "*", // Match any network id
            gasPrice: 1e11,
            gas: 4700000,
            from: '0x1f82285da1d89992d4dadf02dbc89f18a5ffc6ed'
        },
        mainNet: {
            network_id: 1,
            from: '0x00',
            host: 'localhost',
            port: 8545,
            gas: 4e6
        }
    }
};
