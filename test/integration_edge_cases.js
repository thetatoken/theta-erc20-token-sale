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
    var sliver_integration_addr = accounts[7];
    var streamer_addr = accounts[8];
    var public_sale_addr = accounts[9];

    var theta_token;
    var theta_token_sale;
    var exchange_rate = 3000;
    var sell_start_block = 30;
    var sell_end_block = 220;
    var unlock_time = 70000;
    var presale_amount = 20000000;
    var precirculation_amount = 3000;
    var donation_amount = 100;
    var cashout_amount = 50;

    console.log("Imported node Accounts: \n", accounts);

    it ("Integration test: deploy", function() {
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
    });

    it ("Integration test: set exchange rate", function() {
        console.log('----------------');
        return theta_token_sale.setExchangeRate(exchange_rate, {from: exchange_rate_controller, gas: 4700000})
            .then(function() {
                return theta_token_sale.exchangeRate.call()
            })
            .then(function(rate) {
                console.log('Exchange rate set: ' + rate);
            })
    });

    it ("Integration test: set start and end time of sale", function() {
        console.log('----------------');
        return theta_token_sale.setStartTimeOfSale(sell_start_block, {from: admin_addr, gas:4700000})
            .then(function() {
                return theta_token_sale.setEndTimeOfSale(sell_end_block, {from: admin_addr, gas:4700000})
            })
            .then(function() {
                return theta_token_sale.initialBlock.call()
            })
            .then(function(res) {
                console.log('Sale starts at: ' + res);
                return theta_token_sale.finalBlock.call()
            })
            .then(function(res) {
                console.log('Sale ends at: ' + res);
            })
    });

    it ("Integration test: set unlock time", function() {
        console.log('----------------');
        return theta_token_sale.changeUnlockTime(unlock_time, {from: admin_addr, gas:4700000})
            .then(function() {
                return theta_token.getUnlockTime();
            })
            .then(function(res) {
                console.log('Unlock time: ' + res);
            })
    });

    it ("Integration test: presale", function() {
        console.log('----------------');
        return theta_token_sale.allocatePresaleTokens(presale_addr, presale_amount, {from: admin_addr, gas:4700000})
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(res) {
                console.log('Balance of presale account ' + presale_addr + ' is ' + res)
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(res) {
                console.log('Balance of thetaLab reserve account ' + thetalab_reserve_addr + ' is ' + res)
            })
    });

    it ("Integration test: allow precirculation on thetalab_reserve_addr, sliver_integration_addr and streamer_addr", function() {
        console.log('----------------');
        console.log('allowing precirculation for thetalab_reserve_addr: ' + thetalab_reserve_addr);
        return theta_token_sale.allowPrecirculation(thetalab_reserve_addr, {from: admin_addr, gas:4700000})
            .then(function() {
                console.log('allowing precirculation for sliver_integration_addr: ' + sliver_integration_addr)
                return theta_token_sale.allowPrecirculation(sliver_integration_addr, {from: admin_addr, gas:4700000})
            })
            .then(function() {
                console.log('allowing precirculation for streamer_addr: ' + streamer_addr)
                return theta_token_sale.allowPrecirculation(streamer_addr, {from: admin_addr, gas: 4700000})
            })
            .then(function() {
                console.log('done.')          
            })
    });

    it ("Integration test: transfer from thetalab_reserve_addr to sliver_integration_addr", function() {
        console.log('----------------');
        console.log('Before transfer:');
        return theta_token.balanceOf(thetalab_reserve_addr)
            .then(function(res) {
                console.log('Theta reserve balance: ' + res);
                return theta_token.balanceOf(sliver_integration_addr);
            })
            .then(function(res) {
                console.log('Sliver integration account balance: ' + res)
                console.log('Transfering ' + precirculation_amount + ' from thetalab_reserve_addr ' + thetalab_reserve_addr + ' to sliver_integration_addr ' + sliver_integration_addr);
                return theta_token.transfer(sliver_integration_addr, precirculation_amount, {from: thetalab_reserve_addr, gas: 4700000});
            })
            .then(function(res) {
                console.log('After transfer:');
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(res) {
                console.log('Theta reserve balance: ' + res);
                return theta_token.balanceOf(sliver_integration_addr);
            })
            .then(function(res) {
                console.log('Sliver integration account balance: ' + res);
            })
    });

    it ("Integration test: remove thetalab_reserve_addr from precirculation", function() {
        console.log('----------------');
        return theta_token_sale.disallowPrecirculation(thetalab_reserve_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.isPrecirculationAllowed(thetalab_reserve_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function(res) {
                console.log('is precirculation allowed for thetalab_reserve_addr ' + thetalab_reserve_addr + ' ? ' + res);
            })
    });

    it ("Integration test: add whitelist public_sale_addr and presale_addr", function() {
        console.log('----------------');
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr, presale_addr], {from: whitelist_controller, gas:4700000})
            .then(function() {
                return theta_token_sale.isWhitelisted(public_sale_addr);
            })
            .then(function(res) {
                console.log('Is public_sale_addr ' + public_sale_addr + ' whitelisted? ' + res);
                return theta_token_sale.isWhitelisted(presale_addr);
            })
            .then(function(res) {
                console.log('Is presale_addr ' + presale_addr + ' whitelisted?' + res);
                return theta_token_sale.getWhitelist();
            })
            .then(function(res) {
                console.log('All whitelisted accounts: ' + res);
            })
    });

    it ("Integration test: token purchase before sale starts", function() {
    	console.log('');
        console.log('-------- Integration test: token purchase before sale starts --------');
        console.log('');

        assert(web3.eth.blockNumber < sell_start_block);

       	purchase_eth = 1 * (10**18);
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_init_theta_balance = theta_balance;
        		public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
        		console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
        		return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
        	})
        	.catch(function() {
        		console.log('>>> sending ETH did not succeed since sale not started yet, expected');
        	})
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_final_theta_balance = theta_balance;
        		public_sale_addr_final_eth_balance = web3.eth.getBalance(public_sale_addr);
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
        		assert.equal(public_sale_addr_final_theta_balance - public_sale_addr_init_theta_balance, 0, 'should not change!');
        	})
    });

    it ("Integration test: token purchase after sale starts", function() {
    	console.log('');
        console.log('-------- Integration test: token purchase before sale starts --------');
        console.log('');

    	// fast forward to sale time
    	for (var i = web3.eth.blockNumber; i <= sell_start_block + 1; i ++) {
        	console.log('fast-forwarding block :' + web3.eth.blockNumber)
        	force_block = {
            	jsonrpc: "2.0",
            	method: "evm_mine",
            	id: i
        	}
        	web3.currentProvider.send(force_block);
    	};
        assert(web3.eth.blockNumber > sell_start_block);

       	purchase_eth = 1 * (10**18);
        return theta_token_sale.activateSale({from: admin_addr, gas: 4700000})
        	.then(function() {
        		return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000});	
        	})
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_init_theta_balance = theta_balance;
        		public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
        		console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
        		return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
        	})
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_final_theta_balance = theta_balance;
        		public_sale_addr_final_eth_balance = web3.eth.getBalance(public_sale_addr);
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
        		assert.equal(public_sale_addr_final_theta_balance - public_sale_addr_init_theta_balance, purchase_eth * exchange_rate, 'should decrease!');
        	    assert(public_sale_addr_init_eth_balance - public_sale_addr_final_eth_balance >= purchase_eth, 'ETH balance should decrease at least by purchase_eth!');
        	})
    });

});
