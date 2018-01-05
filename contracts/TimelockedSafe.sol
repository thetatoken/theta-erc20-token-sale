pragma solidity ^0.4.18;


import "./SafeMath.sol";
import "./ThetaToken.sol";


//
//    Copyright 2017, Theta Labs, Inc.
//

contract TimelockedSafe {

	uint constant public decimals = 18;

    using SafeMath for uint;

    address public withdrawAddress;

    uint public maximumBalanceInWei;

    uint public cliffInMonths; // locking period in terms of months

    uint public monthlyWithdrawLimitInWei; // monthly withdraw limit AFTER the cliff

    ThetaToken public token;

    uint public startTime;

    function TimelockedSafe(address _withdrawAddress, 
    	uint _maximumBalanceInWei, uint _cliffInMonths, 
    	uint _monthlyWithdrawLimitInWei, address _token) public {

    	// just to prevent mistakenly using an incorrect token unit
    	require(_maximumBalanceInWei > 10000 * (10 ** decimals));
    	require(_monthlyWithdrawLimitInWei > 100 * (10 ** decimals));

    	withdrawAddress = _withdrawAddress;
    	maximumBalanceInWei = _maximumBalanceInWei;
    	cliffInMonths = _cliffInMonths;
    	monthlyWithdrawLimitInWei = _monthlyWithdrawLimitInWei;
    	token = ThetaToken(address);
    	startTime = now;
    }

    function withdraw(uint amountInWei) returns (bool) public {
    	uint oneMonth = 30 days;
    	uint timeElapsed = now.sub(startTime);
    	uint monthsElapsed = timeElapsed.div(oneMonth);
    	uint vestingMonth = monthsElapsed.sub(cliffInMonths).add(1);
    	require(vestingMonth >= 0);

    	address timelockedSafeAddress = address(this);
    	uint withdrawLimit = monthlyWithdrawLimitInWei.mul(vestingMonth);
    	uint minimumBalanceInWei = maximumBalanceInWei.sub(withdrawLimit);
    	uint currentTokenBalanceInWei = token.balanceOf(timelockedSafeAddress);
    	require(currentTokenBalanceInWei.sub(amountInWei) >= minimumBalanceInWei);

    	require(token.transfer(withdrawAddress, amountInWei));

    	return true;
    }

}
