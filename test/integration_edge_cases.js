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
    var exchange_rate = 3547;
    var sale_start_block = web3.eth.blockNumber + 25;
    var sale_end_block = sale_start_block + 50;
    var unlock_time = sale_end_block + 25;
    var presale_amount = new web3.BigNumber(258200823 * Math.pow(10, 18));
    var precirculation_amount = new web3.BigNumber(1892000 * Math.pow(10, 18));
    var donation_amount = new web3.BigNumber(Math.pow(100, 18));
    var cashout_amount = new web3.BigNumber(50 * Math.pow(10, 18));

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
        return theta_token_sale.setStartTimeOfSale(sale_start_block, {from: admin_addr, gas:4700000})
            .then(function() {
                return theta_token_sale.setEndTimeOfSale(sale_end_block, {from: admin_addr, gas:4700000})
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
            })
    });

    it ("Integration test: token purchase before sale starts", function() {
    	console.log('');
        console.log('-------- Integration test: token purchase before sale starts --------');
        console.log('');

        current_block_number = web3.eth.blockNumber;
        console.log('current block number: ' + web3.eth.blockNumber);
        console.log('sale_start_block: ' + sale_start_block);
        assert(current_block_number < sale_start_block);

       	purchase_eth = new web3.BigNumber(1 * Math.pow(10,18));
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
        		web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
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
        		assert(public_sale_addr_final_theta_balance.equals(public_sale_addr_init_theta_balance), 'should not change!');
            })
    });

    it ("Integration test: special account balance checks #3", function() {
        console.log('');
        console.log('-------- Integration test: special account balance checks #3 --------');
        console.log('');

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = new web3.BigNumber(supply);
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(thetalab_balance) {
                thetalab_reserve_balance = new web3.BigNumber(thetalab_balance);
                EPSILON = new web3.BigNumber(10);
                precirc_amount = new web3.BigNumber(precirculation_amount);
                console.log('current total token supply. : ' + current_supply);
                console.log('Theta Labs reserve balance  : ' + thetalab_reserve_balance);
                console.log('pre-circulation total amount: ' + precirculation_amount);

                console.log('reserve ratio: ' + thetalab_reserve_balance.plus(precirculation_amount).dividedBy(current_supply));

                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) < +EPSILON,  'invalid thetalab_reserve_balance ratio');
                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) > -EPSILON, 'invalid thetalab_reserve_balance ratio');                
            })
    });

    it ("Integration test: token purchase after sale starts", function() {
    	console.log('');
        console.log('-------- Integration test: token purchase before sale starts --------');
        console.log('');

    	// fast forward to sale time
    	for (var i = web3.eth.blockNumber; i <= sale_start_block + 1; i ++) {
        	console.log('fast-forwarding block :' + web3.eth.blockNumber)
        	force_block = {
            	jsonrpc: "2.0",
            	method: "evm_mine",
            	id: i
        	}
        	web3.currentProvider.send(force_block);
    	};
        assert(web3.eth.blockNumber > sale_start_block);

       	purchase_eth = new web3.BigNumber(1 * Math.pow(10,18));
        return theta_token_sale.activateSale({from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.changeTokenSaleHardCap(presale_amount.plus(purchase_eth.times(exchange_rate).times(10000)));
            })
            .then(function() {
                return theta_token_sale.changeFundCollectedHardCap(purchase_eth.times(10000));
            })
        	.then(function() {
        		return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000});	
        	})
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_init_theta_balance = new web3.BigNumber(theta_balance);
        		public_sale_addr_init_eth_balance = new web3.BigNumber(web3.eth.getBalance(public_sale_addr));
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
        		console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
        		tx_hash = web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
        	    tx_gas_used = web3.eth.getTransactionReceipt(tx_hash).gasUsed * web3.eth.getTransaction(tx_hash).gasPrice;
            })
        	.then(function() {
        		return theta_token.balanceOf(public_sale_addr);
        	})
        	.then(function(theta_balance) {
        		public_sale_addr_final_theta_balance = new web3.BigNumber(theta_balance);
        		public_sale_addr_final_eth_balance = new web3.BigNumber(web3.eth.getBalance(public_sale_addr));
        		console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
        		console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
        		assert(public_sale_addr_final_theta_balance.minus(public_sale_addr_init_theta_balance).equals(purchase_eth * exchange_rate), 'should decrease!');
        	    assert(public_sale_addr_final_eth_balance.plus(purchase_eth).plus(tx_gas_used).equals(public_sale_addr_init_eth_balance), 'ETH balance should decrease by the expected amount!');
        	})
    });

    it ("Integration test: special account balance checks #2", function() {
        console.log('');
        console.log('-------- Integration test: special account balance checks #2 --------');
        console.log('');

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = new web3.BigNumber(supply);
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(thetalab_balance) {
                thetalab_reserve_balance = new web3.BigNumber(thetalab_balance);
                EPSILON = new web3.BigNumber(10);
                precirc_amount = new web3.BigNumber(precirculation_amount);
                console.log('current total token supply. : ' + current_supply);
                console.log('Theta Labs reserve balance  : ' + thetalab_reserve_balance);
                console.log('pre-circulation total amount: ' + precirculation_amount);

                console.log('reserve ratio: ' + thetalab_reserve_balance.plus(precirculation_amount).dividedBy(current_supply));

                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) < +EPSILON,  'invalid thetalab_reserve_balance ratio');
                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) > -EPSILON, 'invalid thetalab_reserve_balance ratio');                
            })
    });

    it ("Integration test: token purchase from non-whitelisted addresses after sale starts", function() {
        console.log('');
        console.log('-------- Integration test: token purchase from non-whitelisted addresses after sale starts --------');
        console.log('');

        assert(web3.eth.blockNumber > sale_start_block);

        purchase_eth = new web3.BigNumber(1 * Math.pow(10,18));
        return theta_token_sale.deleteAccountsFromWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
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
                console.log('>>> sending ETH did not succeed since the sender address is not whitelisted, expected');
            })
            .then(function() {
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_final_theta_balance = theta_balance;
                public_sale_addr_final_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
                assert(public_sale_addr_final_theta_balance.equals(public_sale_addr_init_theta_balance), 'should decrease!');
                assert(public_sale_addr_init_eth_balance.greaterThan(public_sale_addr_final_eth_balance), 'should cost some gas!');
            })
    });

    it ("Integration test: special account balance checks #3", function() {
        console.log('');
        console.log('-------- Integration test: special account balance checks #3 --------');
        console.log('');

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = new web3.BigNumber(supply);
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(thetalab_balance) {
                thetalab_reserve_balance = new web3.BigNumber(thetalab_balance);
                EPSILON = new web3.BigNumber(10);
                precirc_amount = new web3.BigNumber(precirculation_amount);
                console.log('current total token supply. : ' + current_supply);
                console.log('Theta Labs reserve balance  : ' + thetalab_reserve_balance);
                console.log('pre-circulation total amount: ' + precirculation_amount);

                console.log('reserve ratio: ' + thetalab_reserve_balance.plus(precirculation_amount).dividedBy(current_supply));

                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) < +EPSILON,  'invalid thetalab_reserve_balance ratio');
                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) > -EPSILON, 'invalid thetalab_reserve_balance ratio');                
            })
    });

    it ("Integration test: token purchase with less than minially required ETH", function() {
        console.log('');
        console.log('-------- Integration test: token purchase with less than minially required ETH --------');
        console.log('');

        assert(web3.eth.blockNumber > sale_start_block);

        purchase_eth = 100; // 100 wei, less than 1 szabo 
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
                console.log('>>> sending ETH did not succeed since less than minially required ETH was sent, expected');
            })
            .then(function() {
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_final_theta_balance = theta_balance;
                public_sale_addr_final_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_final_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_final_eth_balance.toString());
                assert(public_sale_addr_final_theta_balance.equals(public_sale_addr_init_theta_balance), 'should not change!');
                assert(public_sale_addr_init_eth_balance.greaterThan(public_sale_addr_final_eth_balance), 'should cost some gas!');
            })
    });

    it ("Integration test: token purchase when sold token count approaches the hard cap", function() {
        console.log('');
        console.log('-------- Integration test: token purchase when sold token count approaches the hard cap --------');
        console.log('');
        
        assert(web3.eth.blockNumber > sale_start_block);

        purchase_eth = new web3.BigNumber(1 * Math.pow(10,18)); // 1 ether
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
            .then(function() {
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                new_token_sale_hard_cap = current_sold_tokens + exchange_rate * purchase_eth / 2;
                return theta_token_sale.changeTokenSaleHardCap(new_token_sale_hard_cap);
            })
            .then(function() {
                return theta_token_sale.tokenSaleHardCap.call();
            })
            .then(function(token_hard_cap) {
                new_token_sale_hard_cap = token_hard_cap;
                console.log('new token sale hard cap: ' + Number(new_token_sale_hard_cap).toString());

                // make sure token sale hard cap is reached first
                new_fund_collected_hard_cap = (Number(new_token_sale_hard_cap) * 100) / exchange_rate;
                return theta_token_sale.changeFundCollectedHardCap(new_fund_collected_hard_cap);
            })
            .then(function() {
                return theta_token_sale.fundCollectedHardCap.call();
            })
            .then(function(fund_hard_cap) {
                console.log('new fund collected hard cap: ' + fund_hard_cap);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('');
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                tx_hash = web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
                tx_gas_used = web3.eth.getTransactionReceipt(tx_hash).gasUsed * web3.eth.getTransaction(tx_hash).gasPrice;
            })
            .then(function() {
                console.log('>>> the first transaction succeeded, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_1 = theta_balance;
                public_sale_addr_eth_balance_1 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_1.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_1.toString());
                assert(public_sale_addr_theta_balance_1.minus(public_sale_addr_init_theta_balance).equals(purchase_eth.times(exchange_rate)), 'should increase!');
                assert(public_sale_addr_init_eth_balance.greaterThan(public_sale_addr_eth_balance_1.plus(purchase_eth)), 'should decrease!');
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('');
                console.log('number of tokens sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                console.log('fund collected: ' + fund_collected.toString());
                console.log('');
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> the second transaction failed since the number of tokens sold reached the hard cap, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_2 = theta_balance;
                public_sale_addr_eth_balance_2 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_2.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_2.toString());
                assert.equal(public_sale_addr_theta_balance_2 - public_sale_addr_theta_balance_1, 0, 'should not change!');
                assert(public_sale_addr_eth_balance_1.greaterThan(public_sale_addr_eth_balance_2), 'should cost some gas!');
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('')
                console.log('total number of token sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                console.log('total fund collected: ' + fund_collected.toString());
            })
    });

    it ("Integration test: token purchase when total fund collected approaches the hard cap", function() {
        console.log('');
        console.log('-------- Integration test: token purchase when total fund collected approaches the hard cap --------');
        console.log('');
        
        assert(web3.eth.blockNumber > sale_start_block);

        purchase_eth = new web3.BigNumber(1 * Math.pow(10,18)); // 1 ether
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
            .then(function() {
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                new_fund_collected_hard_cap = Number(fund_collected) + purchase_eth / 2;
                return theta_token_sale.changeFundCollectedHardCap(new_fund_collected_hard_cap, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.fundCollectedHardCap.call();
            })
            .then(function(fund_hard_cap) {
                new_fund_collected_hard_cap = fund_hard_cap;
                console.log('new fund collected hard cap: ' + new_fund_collected_hard_cap);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function() {
                // make sure fund hard cap reached first
                new_token_sale_hard_cap = (Number(new_fund_collected_hard_cap) + purchase_eth * 1000) * exchange_rate;
                return theta_token_sale.changeTokenSaleHardCap(new_token_sale_hard_cap, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.tokenSaleHardCap.call();
            })
            .then(function(token_hard_cap) {
                console.log('new token sale hard cap: ' + token_hard_cap);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('');
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                tx_hash = web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
                tx_gas_used = web3.eth.getTransactionReceipt(tx_hash).gasUsed * web3.eth.getTransaction(tx_hash).gasPrice;
            })
            .then(function() {
                console.log('>>> the first transaction succeeded, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_1 = theta_balance;
                public_sale_addr_eth_balance_1 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_1.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_1.toString());
                assert(public_sale_addr_theta_balance_1.minus(public_sale_addr_init_theta_balance).equals(purchase_eth.times(exchange_rate)), 'should increase!');
                assert(public_sale_addr_init_eth_balance.greaterThan(public_sale_addr_eth_balance_1.plus(purchase_eth)), 'should decrease!');
                //assert.equal(Number(public_sale_addr_init_eth_balance),
                //             Number(public_sale_addr_eth_balance_1) + Number(purchase_eth) + Number(tx_gas_used), 'ETH balance should decrease by the expected amount!');                return theta_token.totalSupply();
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('');
                console.log('number of tokens sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                console.log('fund collected: ' + fund_collected.toString());
                console.log('');
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> the second transaction failed since the number of tokens sold reached the hard cap, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_2 = theta_balance;
                public_sale_addr_eth_balance_2 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_2.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_2.toString());
                assert(public_sale_addr_theta_balance_2.equals(public_sale_addr_theta_balance_1), 'should not change!');
                assert(public_sale_addr_eth_balance_1.greaterThan(public_sale_addr_eth_balance_2), 'should cost some gas!');
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = Number(supply);
                current_sold_tokens = current_supply * 40 / 100;
                console.log('')
                console.log('total number of token sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                console.log('total fund collected: ' + fund_collected.toString());
            })
    });

    it ("Integration test: special account balance checks #4", function() {
        console.log('');
        console.log('-------- Integration test: special account balance checks #4 --------');
        console.log('');

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = new web3.BigNumber(supply);
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(thetalab_balance) {
                thetalab_reserve_balance = new web3.BigNumber(thetalab_balance);
                EPSILON = new web3.BigNumber(10);
                precirc_amount = new web3.BigNumber(precirculation_amount);
                console.log('current total token supply. : ' + current_supply);
                console.log('Theta Labs reserve balance  : ' + thetalab_reserve_balance);
                console.log('pre-circulation total amount: ' + precirculation_amount);

                console.log('reserve ratio: ' + thetalab_reserve_balance.plus(precirculation_amount).dividedBy(current_supply));

                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) < +EPSILON,  'invalid thetalab_reserve_balance ratio');
                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) > -EPSILON, 'invalid thetalab_reserve_balance ratio');                
            })
    });

    it ("Integration test: emergency sale stop/restart", function() {
        console.log('');
        console.log('-------- Integration test: emergency sale stop/restart --------');
        console.log('');

        purchase_eth = new web3.BigNumber(1 * Math.pow(10,18)); // 1 ether
        return theta_token_sale.addAccountsToWhitelist([public_sale_addr], {from: whitelist_controller, gas: 4700000})
            .then(function() {
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                // make sure we don't hit the fund hard cap
                new_fund_collected_hard_cap = Number(fund_collected) + purchase_eth * 1000;
                return theta_token_sale.changeFundCollectedHardCap(new_fund_collected_hard_cap, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.fundCollectedHardCap.call();
            })
            .then(function(fund_hard_cap) {
                new_fund_collected_hard_cap = fund_hard_cap;
                console.log('new fund collected hard cap: ' + new_fund_collected_hard_cap);
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                // make sure we don't hit the token sale hard cap
                new_token_sale_hard_cap = Number(supply) * 0.4 + purchase_eth * exchange_rate * 1000;
                return theta_token_sale.changeTokenSaleHardCap(new_token_sale_hard_cap, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.tokenSaleHardCap.call();
            })
            .then(function(token_hard_cap) {
                console.log('new token sale hard cap: ' + token_hard_cap);
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = theta_balance;
                public_sale_addr_init_eth_balance = web3.eth.getBalance(public_sale_addr);
                console.log('');
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                tx_hash = web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
                tx_gas_used = web3.eth.getTransactionReceipt(tx_hash).gasUsed * web3.eth.getTransaction(tx_hash).gasPrice;
            })
            .then(function() {
                console.log('>>> the first transaction succeeded, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_1 = theta_balance;
                public_sale_addr_eth_balance_1 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_1.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_1.toString());
                assert(public_sale_addr_theta_balance_1.minus(public_sale_addr_init_theta_balance).equals(purchase_eth * exchange_rate), 'should increase!');
                assert(public_sale_addr_init_eth_balance.greaterThan(public_sale_addr_eth_balance_1.plus(purchase_eth)), 'should decrease!');
                return theta_token_sale.emergencyStopSale({from: admin_addr, gas: 4700000});
            })
            .then(function() {
                console.log('');
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> the second transaction did not succeed due to emergency stop, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_2 = theta_balance;
                public_sale_addr_eth_balance_2 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_2.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_2.toString());
                assert(public_sale_addr_theta_balance_2.equals(public_sale_addr_theta_balance_1), 'should not change!');
                assert(public_sale_addr_eth_balance_1.greaterThan(public_sale_addr_eth_balance_2), 'should cost some gas!');
                return theta_token_sale.restartSale({from: admin_addr, gas: 4700000});
            })
            .then(function() {
                console.log('');
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .then(function() {
                console.log('>>> the third transaction succeeded since sale restarted, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_3 = theta_balance;
                public_sale_addr_eth_balance_3 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_3.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_3.toString());
                assert(public_sale_addr_theta_balance_3.minus(public_sale_addr_theta_balance_2).equals(purchase_eth.times(exchange_rate)), 'should increase!');
                assert(public_sale_addr_eth_balance_2.greaterThan(public_sale_addr_eth_balance_3.plus(purchase_eth)), 'should decrease!');
            })
    });

    it ("Integration test: token transfer() before unlockTime", function() {
        console.log('');
        console.log('-------- Integration test: token transfer() before unlockTime --------');
        console.log('');

        assert(web3.eth.blockNumber < unlock_time);

        precirculation_allowed_addr = streamer_addr;
        precirculation_disallowed_addr = public_sale_addr;
        transfer_amount_1 = 1234;
        return theta_token_sale.allowPrecirculation(presale_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_init_balance = balance;
                console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_init_balance = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
                console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens ...')
                return theta_token.transfer(precirculation_allowed_addr, transfer_amount_1, {from: presale_addr, gas: 4700000})
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert(presale_purchaser_after_first_transfer.minus(presale_purchaser_init_balance).equals(-transfer_amount_1), 'should decrease by the transfer amount!');
                assert(precirculation_allowed_addr_balance_after_first_transfer.minus(precirculation_allowed_addr_init_balance).equals(transfer_amount_1), 'should increase by the transfer amount!');
            })
            .then(function() {
                // transferring more amount than the balance, should fail
                transfer_amount_2 = parseInt(precirculation_allowed_addr_balance_after_first_transfer) + 3537;
                console.log('');
                console.log('>>> transferring ' + transfer_amount_2.toString() + ' tokens back to presale purchaser...')
                return theta_token.transfer(presale_addr, transfer_amount_2, {from: precirculation_allowed_addr, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transfer did not succeed since the amount is higher than the blance, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_second_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert(presale_purchaser_after_second_transfer.equals(presale_purchaser_after_first_transfer), 'should not change!');
                assert(precirculation_allowed_addr_balance_after_second_transfer.equals(precirculation_allowed_addr_balance_after_first_transfer), 'should not change!');
            })
            .then(function() {
                console.log('');
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_init_balance = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
                console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens to precirculation disallowed address...')
                return theta_token.transfer(precirculation_disallowed_addr, transfer_amount_1, {from: presale_addr, gas: 4700000})
            })
            .catch(function() {
                console.log('>>> transfer did not succeed since the target address is disallowed from precirculation, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_balance_after_third_transfer = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
                assert(presale_purchaser_after_third_transfer.equals(presale_purchaser_after_second_transfer), 'should not change!');
                assert(precirculation_disallowed_addr_balance_after_third_transfer.equals(precirculation_disallowed_addr_init_balance), 'should not change!');
            })
    });

    it ("Integration test: token transferFrom() before unlockTime", function() {
        console.log('');
        console.log('-------- Integration test: token transferFrom() before unlockTime --------');
        console.log('');

        assert(web3.eth.blockNumber < unlock_time);

        transfer_amount_1 = new web3.BigNumber(1234);
        transfer_amount_2 = new web3.BigNumber(355);
        transfer_amount_3 = new web3.BigNumber(100);        
        allowance_amount = new web3.BigNumber(1000);
        precirculation_allowed_addr = streamer_addr;
        transfer_operator = streamer_addr;
        return theta_token_sale.allowPrecirculation(presale_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                console.log('approving allowance: ' + allowance_amount.toString());
                return theta_token.approve(transfer_operator, allowance_amount, {from: presale_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('');
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_init_balance = balance;
                console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_init_balance = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_1.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_allowed_addr, transfer_amount_1, 
                    {from: transfer_operator, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transferFrom() did not succeed since the amount is higher than the allowance, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert(presale_purchaser_after_first_transfer.equals(presale_purchaser_init_balance), 'should not change!');
                assert(precirculation_allowed_addr_balance_after_first_transfer.equals(precirculation_allowed_addr_init_balance), 'should not change!');
            })
            .then(function() {
                console.log('');
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_2.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_allowed_addr, transfer_amount_2, 
                    {from: transfer_operator, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_second_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_second_transfer.toString());
                assert(allowance_amount.minus(allowance_remaining).equals(transfer_amount_2), 'should decrease by transfer amount!');
                assert(presale_purchaser_after_second_transfer.minus(presale_purchaser_after_first_transfer).equals(-transfer_amount_2), 'should decrease by transfer amount!');
                assert(precirculation_allowed_addr_balance_after_second_transfer.minus(precirculation_allowed_addr_balance_after_first_transfer).equals(transfer_amount_2), 'should increase by transfer amount!');
            })
            .then(function() {
                console.log('');
                return theta_token_sale.allowPrecirculation(transfer_operator, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_init_balance = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_3.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_disallowed_addr, transfer_amount_3, 
                    {from: transfer_operator, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transferFrom() did not succeed since the target address is not allowed for precirculation, expected');
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_balance_after_third_transfer = balance;
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
                assert(allowance_amount.minus(allowance_remaining).equals(transfer_amount_2), 'should decrease by transfer amount!');
                assert(presale_purchaser_after_third_transfer.equals(presale_purchaser_after_second_transfer), 'should not change!');
                assert(precirculation_disallowed_addr_balance_after_third_transfer.equals(precirculation_disallowed_addr_init_balance), 'should not change!');
            })
    });

    it ("Integration test: attempt to purchase tokens after token sale ends", function() {
        console.log('');
        console.log('-------- Integration test: attempt to purchase tokens after token sale ends --------');
        console.log('');

        // fast forward to sale end time
        for (var i = web3.eth.blockNumber; i <= sale_end_block + 1; i ++) {
            console.log('fast-forwarding block :' + web3.eth.blockNumber)
            force_block = {
                jsonrpc: "2.0",
                method: "evm_mine",
                id: i
            }
            web3.currentProvider.send(force_block);
        };
        assert(web3.eth.blockNumber > sale_end_block);

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = new web3.BigNumber(supply);
                current_sold_tokens = current_supply.times(40).div(100);
                console.log('');
                console.log('number of tokens sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                current_fund_collected = new web3.BigNumber(fund_collected);
                console.log('fund collected: ' + current_fund_collected.toString());
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_init_theta_balance = new web3.BigNumber(theta_balance);
                public_sale_addr_init_eth_balance = new web3.eth.getBalance(public_sale_addr);
                console.log('');
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_init_theta_balance.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_init_eth_balance.toString());
                console.log('>>> public sale purchaser sending ' + purchase_eth + ' wei (ETH) to ThetaTokenSale...');
                return web3.eth.sendTransaction({from: public_sale_addr, to: theta_token_sale.address, value: purchase_eth, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> the transaction did not succeeded since the token sale aleady ended, expected');
                return theta_token.balanceOf(public_sale_addr);
            })
            .then(function(theta_balance) {
                public_sale_addr_theta_balance_1 = new web3.BigNumber(theta_balance);
                public_sale_addr_eth_balance_1 = web3.eth.getBalance(public_sale_addr);
                console.log('public sale purchaser Theta balance: ' + public_sale_addr_theta_balance_1.toString());
                console.log('public sale purchaser ETH balance: ' + public_sale_addr_eth_balance_1.toString());
                assert(public_sale_addr_theta_balance_1.equals(public_sale_addr_init_theta_balance), 'should not change!');
                assert(public_sale_addr_init_eth_balance.greaterThanOrEqualTo(public_sale_addr_eth_balance_1), 'should cost some gas!');
                return theta_token.totalSupply();
            })
            .then(function(supply) {
                current_supply = new web3.BigNumber(supply);
                current_sold_tokens_1 = current_supply.times(40).div(100);
                console.log('');
                console.log('number of tokens sold: ' + current_sold_tokens.toString());
                return theta_token_sale.getFundCollected({from: admin_addr, gas: 4700000});
            })
            .then(function(fund_collected) {
                current_fund_collected_1 = new web3.BigNumber(fund_collected);
                console.log('fund collected: ' + current_fund_collected_1.toString());
                assert(current_sold_tokens.equals(current_sold_tokens_1), 'should not have sold more tokens');
                assert(current_fund_collected.equals(current_fund_collected_1), 'should not have collected more fund');
            })
    });

    it ("Integration test: token transfer() after unlockTime", function() {
        console.log('');
        console.log('-------- Integration test: token transfer() after unlockTime --------');
        console.log('');

        // fast forward to unlock time
        for (var i = web3.eth.blockNumber; i <= unlock_time + 1; i ++) {
            console.log('fast-forwarding block :' + web3.eth.blockNumber)
            force_block = {
                jsonrpc: "2.0",
                method: "evm_mine",
                id: i
            }
            web3.currentProvider.send(force_block);
        };
        assert(web3.eth.blockNumber > unlock_time);

        past_unlock_time = 0;
        transfer_amount_1 = new web3.BigNumber(1234);
        return theta_token_sale.allowPrecirculation(presale_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.disallowPrecirculation(precirculation_disallowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_init_balance = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_init_balance = new web3.BigNumber(balance);
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
                console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens ...')
                return theta_token.transfer(precirculation_allowed_addr, transfer_amount_1, {from: presale_addr, gas: 4700000})
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = new web3.BigNumber(balance);
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert(presale_purchaser_after_first_transfer.minus(presale_purchaser_init_balance).equals(-transfer_amount_1), 'should decrease by the transfer amount!');
                assert(precirculation_allowed_addr_balance_after_first_transfer.minus(precirculation_allowed_addr_init_balance).equals(transfer_amount_1), 'should increase by the transfer amount!');
            })
            .then(function() {
                // transferring more amount than the balance, should fail
                transfer_amount_2 = parseInt(precirculation_allowed_addr_balance_after_first_transfer) + 3537;
                console.log('');
                console.log('>>> transferring ' + transfer_amount_2.toString() + ' tokens back to presale purchaser...')
                return theta_token.transfer(presale_addr, transfer_amount_2, {from: precirculation_allowed_addr, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transfer did not succeed since the amount is higher than the blance, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_second_transfer = new web3.BigNumber(balance);
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert(presale_purchaser_after_second_transfer.minus(presale_purchaser_after_first_transfer).equals(0), 'should not change!');
                assert(precirculation_allowed_addr_balance_after_second_transfer.minus(precirculation_allowed_addr_balance_after_first_transfer).equals(0), 'should not change!');
            })
            .then(function() {
                console.log('');
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_init_balance = new web3.BigNumber(balance);
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
                console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens to precirculation disallowed address...')
                return theta_token.transfer(precirculation_disallowed_addr, transfer_amount_1, {from: presale_addr, gas: 4700000})
            })
            .then(function() {
                console.log('>>> transfer succeeded since unlockTime is already passed, expected');
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_balance_after_third_transfer = new web3.BigNumber(balance);
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
                assert(presale_purchaser_after_third_transfer.minus(presale_purchaser_after_second_transfer).equals(-transfer_amount_1) , 'should decrease by the transfer amount!');
                assert(precirculation_disallowed_addr_balance_after_third_transfer.minus(precirculation_disallowed_addr_init_balance).equals(transfer_amount_1), 'should increase by the transfer amount!');
            })
    });

    it ("Integration test: token transferFrom() after unlockTime", function() {
        console.log('');
        console.log('-------- Integration test: token transferFrom() after unlockTime --------');
        console.log('');

        assert(web3.eth.blockNumber > unlock_time);

        past_unlock_time = 0;
        transfer_amount_1 = new web3.BigNumber(1234);
        transfer_amount_2 = new web3.BigNumber(355);
        transfer_amount_3 = new web3.BigNumber(100);
        attacker_transfer_amount = new web3.BigNumber(10);        
        allowance_amount = new web3.BigNumber(1000);
        return theta_token_sale.allowPrecirculation(presale_addr, {from: admin_addr, gas: 4700000})
            .then(function() {
                return theta_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token_sale.disallowPrecirculation(precirculation_disallowed_addr, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.approve(transfer_operator, 0, {from: presale_addr, gas: 4700000});
            })
            .then(function() {
                console.log('approving allowance: ' + allowance_amount.toString());
                return theta_token.approve(transfer_operator, allowance_amount, {from: presale_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('');
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_init_balance = balance;
                console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_init_balance = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_1.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_allowed_addr, transfer_amount_1, 
                    {from: transfer_operator, gas: 4700000});
            })
            .catch(function() {
                console.log('>>> transferFrom() did not succeed since the amount is higher than the allowance, expected');
            })
            .then(function() {
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = balance;
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = balance;
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                assert.equal(presale_purchaser_after_first_transfer - presale_purchaser_init_balance, 0, 'should not change!');
                assert.equal(precirculation_allowed_addr_balance_after_first_transfer - precirculation_allowed_addr_init_balance, 0, 'should not change!');
            })
            .then(function() {
                console.log('');
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_first_transfer = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_first_transfer = new web3.BigNumber(balance);
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_2.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_allowed_addr, transfer_amount_2, 
                    {from: transfer_operator, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_allowed_addr);
            })
            .then(function(balance) {
                precirculation_allowed_addr_balance_after_second_transfer = new web3.BigNumber(balance);
                console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_second_transfer.toString());
                assert.equal(allowance_amount - allowance_remaining, transfer_amount_2, 'should decrease by transfer amount!');
                assert(presale_purchaser_after_second_transfer.minus(presale_purchaser_after_first_transfer).equals(-transfer_amount_2), 'should decrease by transfer amount!');
                assert(precirculation_allowed_addr_balance_after_second_transfer.minus(precirculation_allowed_addr_balance_after_first_transfer).equals(transfer_amount_2), 'should increase by transfer amount!');
            })
            .then(function() {
                console.log('');
                return theta_token_sale.allowPrecirculation(transfer_operator, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_second_transfer = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_init_balance = new web3.BigNumber(balance);
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
                console.log('>>> using transferFrom() to transfer ' + transfer_amount_3.toString() + ' tokens...');
                return theta_token.transferFrom(presale_addr, precirculation_disallowed_addr, transfer_amount_3, 
                    {from: transfer_operator, gas: 4700000});
            })
            .then(function() {
                console.log('>>> transfer succeeded since unlockTime is already passed, expected');
                return theta_token.allowance(presale_addr, transfer_operator);
            })
            .then(function(allowance) {
                allowance_remaining = allowance;
                console.log('remaining allowance: ' + allowance_remaining.toString());
                return theta_token.balanceOf(presale_addr);
            })
            .then(function(balance) {
                presale_purchaser_after_third_transfer = new web3.BigNumber(balance);
                console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
                return theta_token.balanceOf(precirculation_disallowed_addr);
            })
            .then(function(balance) {
                precirculation_disallowed_addr_balance_after_third_transfer = new web3.BigNumber(balance);
                console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
                assert(allowance_amount.minus(allowance_remaining).equals(transfer_amount_2.plus(transfer_amount_3)), 'should decrease by the total transfer amount!');
                assert(presale_purchaser_after_third_transfer.minus(presale_purchaser_after_second_transfer).equals(-transfer_amount_3), 'should decrease by transfer amount!');
                assert(precirculation_disallowed_addr_balance_after_third_transfer.minus(precirculation_disallowed_addr_init_balance).equals(transfer_amount_3), 'should decrease by transfer amount!');
            })
    });

    it ("Integration test: special account balance checks #5", function() {
        console.log('');
        console.log('-------- Integration test: special account balance checks #5 --------');
        console.log('');

        return theta_token.totalSupply()
            .then(function(supply) {
                current_supply = new web3.BigNumber(supply);
                return theta_token.balanceOf(thetalab_reserve_addr);
            })
            .then(function(thetalab_balance) {
                thetalab_reserve_balance = new web3.BigNumber(thetalab_balance);
                EPSILON = new web3.BigNumber(10);
                precirc_amount = new web3.BigNumber(precirculation_amount);
                console.log('current total token supply. : ' + current_supply);
                console.log('Theta Labs reserve balance  : ' + thetalab_reserve_balance);
                console.log('pre-circulation total amount: ' + precirculation_amount);

                console.log('reserve ratio: ' + thetalab_reserve_balance.plus(precirculation_amount).dividedBy(current_supply));

                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) < +EPSILON,  'invalid thetalab_reserve_balance ratio');
                assert(current_supply.times(0.6).minus(thetalab_reserve_balance).minus(precirc_amount) > -EPSILON, 'invalid thetalab_reserve_balance ratio');                
            })
    });

});


