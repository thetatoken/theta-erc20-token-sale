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
            from: '0x2aa61a64bab31d9a32f3efc0f096d10e6f839a60'
        },
        privateChain: {
            host: "localhost",
            port: 10004,
            network_id: "*",
            gasPrice: 1e11,
            gas: 4700000,
            from: 'cdbeba354b8ade195a9467c9b56da19bffaf7dc9'
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
