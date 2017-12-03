var ThetaToken = artifacts.require('ThetaToken');
var ThetaTokenSale = artifacts.require('ThetaTokenSale');
contract('ThetaToken', function(accounts) {
    var root_addr     = accounts[0];
    var admin_addr    = accounts[1];
    var whitelist_controller    = accounts[2];
    var exchange_rate_controller = accounts[3];
    var thetalab_reserve_addr = accounts[4];
    var fund_deposit_addr = accounts[5];
    var presale_addr = accounts[6];
    var token_recepient_address = accounts[7];
    var streamer_addr = accounts[8];
    var public_sale_addr = accounts[9];

    var theta_token;
    var theta_token_sale;
    var exchange_rate = 1;
    var sell_start_block_delta = 30; // current block + delta = start block
    var sell_end_block_delta = 60; // current block + delta = end block
    var sell_start_block;
    var sell_end_block;
    var unlock_time_delta = 90; // current block + delta = unlock time
    var unlock_time;
    var presale_amount = 20000000;
    var precirculation_amount = 3000;
    var donation_amount = 100;
    var cashout_amount = 50;
    var public_sale_amount = 3000000000000000000;  //3 ether
    var token_transfer_amount = 2000000000000000000;

    console.log("Imported node Accounts: \n", accounts);

    it ("Integration test: deploy & preparation : ", function() {
        console.log('----------------');
        return ThetaToken.deployed()
            .then(function(tt) {
                theta_token = tt;
                console.log('ThetaToken Address: ' + theta_token.address);
                return ThetaTokenSale.deployed();
            })
            .then(function(tts) {
                theta_token_sale = tts;
                console.log('ThetaTokenSale Address: ' + theta_token_sale.address);
            })
            .then(function() {
                return theta_token_sale.setExchangeRate(exchange_rate, {from: exchange_rate_controller, gas: 4700000});
            })
            .then(function() {
                sell_start_block = web3.eth.blockNumber + sell_start_block_delta;
                console.log('Setting start time of sale ' + sell_start_block);
                return theta_token_sale.setStartTimeOfSale(sell_start_block, {from: admin_addr, gas:4700000});
            })
            .then(function() {
                sell_end_block = web3.eth.blockNumber + sell_end_block_delta;
                console.log('Setting end time of sale ' + sell_end_block);
                return theta_token_sale.setEndTimeOfSale(sell_end_block, {from: admin_addr, gas:4700000});
            })
            .then(function() {
                console.log('Setting unlock time');
                unlock_time = web3.eth.blockNumber + unlock_time_delta;
                console.log('Setting token unlock time ' + unlock_time);
                return theta_token_sale.changeUnlockTime(unlock_time, {from: admin_addr, gas:4700000});
            })
            .then(function() {
                console.log('Allocating presale');
                return theta_token_sale.allocatePresaleTokens(presale_addr, presale_amount, {from: admin_addr, gas:4700000});
            })
            .then(function() {
                return theta_token_sale.addAccountsToWhitelist([public_sale_addr, presale_addr], {from: whitelist_controller, gas:4700000});
            })
            .then(function() {
                console.log('Preparation done.');
            })
    });

    it ("Integration test: start sale", function() {
        console.log('----------------');
        return theta_token_sale.activateSale({from: admin_addr, gas: 4700000})
            .then(function() {
                console.log('Sale activated.')
                // fast forward to sale time
                for (var i = web3.eth.blockNumber; i < sell_start_block; i ++) {
                    console.log('fast-forwarding block :' + web3.eth.blockNumber)
                    force_block = {
                        jsonrpc: "2.0",
                        method: "evm_mine",
                        id: i
                    }
                    web3.currentProvider.send(force_block);
                };
                console.log('Current blocknumber is :' + web3.eth.blockNumber);
            });
    });

    it ("Integration test: public sale", function() {
        console.log('----------------');

        return theta_token.balanceOf(thetalab_reserve_addr)
            .then(function(res) {
                theta_reserve_token_balance_before_invest = res;
                console.log('Token balance of theta reserve account before invest is ' + theta_reserve_token_balance_before_invest);
                return theta_token.balanceOf(public_sale_addr)
            })
            .then(function(res) {
                public_sale_token_balance_before_invest = res;
                console.log('Token balance of public sale account before invest is ' + public_sale_token_balance_before_invest);

                public_sale_eth_balance_before_invest  = web3.eth.getBalance(public_sale_addr);
                console.log('Ether balance of public sale account before invest is ' + public_sale_eth_balance_before_invest);
                
                fund_deposit_eth_balance_before_invest = web3.eth.getBalance(fund_deposit_addr);
                console.log('Ether balance of fund deposit account before invest is  ' + fund_deposit_eth_balance_before_invest);
                console.log('');
                
                public_sale_obj = {
                    from: public_sale_addr,
                    to: theta_token_sale.address,
                    value: public_sale_amount,
                    gas:4700000
                }
                console.log('Investing ' + public_sale_amount + ' wei from public_sale_addr ' + public_sale_addr + ' ...');
                invest_hash = web3.eth.sendTransaction(public_sale_obj);
                console.log('Hash for invest transaction: ' + invest_hash);
                invest_gas_used = web3.eth.getTransactionReceipt(invest_hash).gasUsed * web3.eth.getTransaction(invest_hash).gasPrice;
                console.log('Gas used for invest is ' + invest_gas_used);
                console.log('');

                return theta_token.balanceOf(thetalab_reserve_addr)
            })
            .then (function(res) {
                theta_reserve_token_balance_after_invest = res;
                console.log('Token balance of theta reserve account after invest is ' + theta_reserve_token_balance_after_invest);
                target_theta_reserve_token_balance_delta = public_sale_amount * exchange_rate * 60 / 40;
                assert.equal(theta_reserve_token_balance_after_invest - theta_reserve_token_balance_before_invest, target_theta_reserve_token_balance_delta, 'incorrect theta reserve token balance');
                
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(res) {
                public_sale_token_balance_after_invest = res;
                console.log('Token balance of public sale account after invest is ' + public_sale_token_balance_after_invest);
                target_public_sale_token_balance_delta = public_sale_amount * exchange_rate;
                assert.equal(public_sale_token_balance_after_invest - public_sale_token_balance_before_invest,  target_public_sale_token_balance_delta, 'incorrect public sale token balance');

                public_sale_eth_balance_after_invest  = web3.eth.getBalance(public_sale_addr);
                console.log('Ether balance of public sale account after invest is ' + public_sale_eth_balance_after_invest);
                assert.equal(Number(public_sale_eth_balance_before_invest), Number(public_sale_amount) + Number(invest_gas_used) + Number(public_sale_eth_balance_after_invest), 'incorrect public sale ether balance');
                
                fund_deposit_eth_balance_after_invest = web3.eth.getBalance(fund_deposit_addr);
                console.log('Ether balance of fund deposit account after invest is  ' + fund_deposit_eth_balance_after_invest);
                assert.equal(Number(fund_deposit_eth_balance_before_invest), Number(fund_deposit_eth_balance_after_invest) - Number(public_sale_amount), 'incorrect fund deposit ether balance');
            })
            ;
    });

    it ("Integration test: end sale", function() {
        console.log('----------------');
        return theta_token_sale.saleFinalized.call()
            .then(function(res) {
                console.log('Sale finalization status: ' + res);
                assert.equal(res, false, 'sale should not be finalized yet')
                // fast forward to sale end time
                for (var i = web3.eth.blockNumber; i < sell_end_block; i ++) {
                    console.log('fast-forwarding block :' + web3.eth.blockNumber)
                    force_block = {
                        jsonrpc: "2.0",
                        method: "evm_mine",
                        id: i
                    }
                    web3.currentProvider.send(force_block);
                };
                console.log('Current blocknumber is :' + web3.eth.blockNumber);
                return theta_token_sale.finalizeSale({from: root_addr, gas:4700000});
            })
            .then(function() {
                return theta_token_sale.saleFinalized.call();
            })
            .then(function(res) {
                console.log('Sale finalization status: ' + res);
                assert.equal(res, true, 'sale should be finalized')
            })
            ;
    });

    it ("Integration test: transfer after unlock", function() {
        console.log('----------------');
        return theta_token.getUnlockTime()
            .then(function(res) {
                console.log('Unlock time is: ' + res);
                assert.equal(res, unlock_time, 'unlock time should be unchanged');

                // fast forward to unlock time
                for (var i = web3.eth.blockNumber; i < unlock_time; i ++) {
                    console.log('fast-forwarding block :' + web3.eth.blockNumber)
                    force_block = {
                        jsonrpc: "2.0",
                        method: "evm_mine",
                        id: i
                    }
                    web3.currentProvider.send(force_block);
                };
                console.log('Current blocknumber is :' + web3.eth.blockNumber);
                return theta_token.balanceOf(token_recepient_address);
            })
            .then(function(res) {
                sliver_integration_token_balance_before_transfer = res;
                console.log('Token balance of token recepient before transfer is  ' + sliver_integration_token_balance_before_transfer);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(res) {
                public_sale_token_balance_before_transfer = res;
                console.log('Token balance of public sale address before transfer is ' + public_sale_token_balance_before_transfer);

                console.log('');
                console.log('Transfer ' + token_transfer_amount + ' from public sale address to token recepient..');
                return theta_token.transfer(token_recepient_address, token_transfer_amount, {from: public_sale_addr, gas: 4700000});
            })
            .then(function() {
                console.log('Transfer done.');
                return theta_token.balanceOf(token_recepient_address);
            })
            .then(function(res) {
                console.log('');
                sliver_integration_token_balance_after_transfer = res;
                console.log('Token balance of token recepient after transfer is ' + sliver_integration_token_balance_after_transfer);
                assert.equal(Number(sliver_integration_token_balance_before_transfer) + Number(token_transfer_amount), Number(sliver_integration_token_balance_after_transfer), 'incorrect token recepient token balance');

                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(res) {
                public_sale_token_balance_after_transfer = res;
                console.log('Token balance of public sale address after transfer is ' + public_sale_token_balance_after_transfer);
                assert.equal(Number(public_sale_token_balance_before_transfer) - Number(token_transfer_amount), Number(public_sale_token_balance_after_transfer), 'incorrect public sale addr token balance');
            })
            ;
    });
});



