pragma solidity ^0.4.18;


import "./SafeMath.sol";
import "./ThetaToken.sol";


//
//    Copyright 2017, Theta Labs, Inc.
//

contract TimelockedSafe {

    using SafeMath for uint;

	uint constant public decimals = 18;

	uint constant public oneMonth = 30 days;

    address public withdrawAddress;

    uint public lockingPeriodInMonths; // all tokens are locked for a certain period

    uint public vestingPeriodInMonths; // after the locking period ends the vesting period starts, but each month
                                       // there is a token withdraw limit as defined below

    uint public monthlyWithdrawLimitInWei; // monthly withdraw limit during the vesting period

    ThetaToken public token;

    uint public startTime;

    function TimelockedSafe(address _withdrawAddress,
    	uint _lockingPeriodInMonths, uint _vestingPeriodInMonths,
    	uint _monthlyWithdrawLimitInWei, address _token) public {
    	require(_withdrawAddress != 0);
    	require(_token != 0);

    	// just to prevent mistakenly passing in a value with incorrect token unit
    	require(_monthlyWithdrawLimitInWei > 100 * (10 ** decimals));

    	withdrawAddress = _withdrawAddress;
    	lockingPeriodInMonths = _lockingPeriodInMonths;
    	vestingPeriodInMonths = _vestingPeriodInMonths;
    	monthlyWithdrawLimitInWei = _monthlyWithdrawLimitInWei;
    	token = ThetaToken(_token);
    	startTime = now;
    }

    function withdraw(uint _withdrawAmountInWei) public returns (bool) {    	
    	uint timeElapsed = now.sub(startTime);
    	uint monthsElapsed = (timeElapsed.div(oneMonth)).add(1);
    	require(monthsElapsed >= lockingPeriodInMonths);

    	uint fullyVestedTimeInMonths = lockingPeriodInMonths.add(vestingPeriodInMonths);
    	uint remainingVestingPeriodInMonths = 0;
    	if (monthsElapsed < fullyVestedTimeInMonths) {
    		remainingVestingPeriodInMonths = fullyVestedTimeInMonths.sub(monthsElapsed);
    	}

    	address timelockedSafeAddress = address(this);
    	uint minimalBalanceInWei = remainingVestingPeriodInMonths.mul(monthlyWithdrawLimitInWei);
    	uint currentTokenBalanceInWei = token.balanceOf(timelockedSafeAddress);
    	require(currentTokenBalanceInWei.sub(_withdrawAmountInWei) >= minimalBalanceInWei);

    	require(token.transfer(withdrawAddress, _withdrawAmountInWei));

    	return true;
    }

}
