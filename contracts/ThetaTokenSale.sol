pragma solidity ^0.4.18;


import "./SafeMath.sol";
import "./ThetaToken.sol";


//
//    Copyright 2017, Theta Labs, Inc.
//

contract ThetaTokenSale {

    using SafeMath for uint;

    address internal root;

    address internal admin;

    address internal whitelistController;

    address internal exchangeRateController;

    address internal thetaLabsReserve;

    address internal fundDeposit;

    uint public initialBlock;             // Block number indicating when the sale starts. Inclusive. sale will be opened at initial block.

    uint public finalBlock;               // Block number indicating when the sale ends. Exclusive, sale will be closed at ends block.

    mapping (address => bool) public whitelistMap; // Only the accounts in white list can buy theta tokens

    uint public exchangeRate;                      // Exchange rate between 1 wei-Theta and 1 wei-Ether (18 decimals)

    uint internal fundCollected = 0;              // ETH in wei
    bool public saleStopped = false;               // Has Theta Labs stopped the sale?
    bool public saleFinalized = false;             // Has Theta Labs finalized the sale?
    bool public activated = false;                 // Is the token sale activated

    ThetaToken public token;                       // The token

    uint constant public decimals = 18;
    uint constant public dust = 1 szabo;           // Minimum investment
    uint public tokenSaleHardCap = 30 * (10**6) * (10**decimals); // Token sale hardcap
    uint public fundCollectedHardCap = 25000 * (10**18); // max ETH collected

    event Whitelist(address addr);

    event RemoveFromWhitelist(address addr);


    function ThetaTokenSale(
        address _root,
        address _admin,
        address _whitelistController,
        address _exchangeRateController,
        address _thetaLabsReserve,
        address _fundDeposit,
        uint _initialBlock,
        uint _finalBlock,
        uint _exchangeRate)
        non_zero_address(_root)
        non_zero_address(_admin)
        non_zero_address(_whitelistController)
        non_zero_address(_exchangeRateController)
        non_zero_address(_thetaLabsReserve) 
        non_zero_address(_fundDeposit) public {
        require(_initialBlock >= getBlockNumber());
        require(_initialBlock < _finalBlock);
        require(_exchangeRate > 0);
        require(_root != _admin);
        require(_admin != _whitelistController);
        require(_admin != _exchangeRateController);

        // Save constructor arguments as global variables
        root  = _root;
        admin = _admin;
        whitelistController = _whitelistController;
        exchangeRateController = _exchangeRateController;
        thetaLabsReserve = _thetaLabsReserve;
        fundDeposit = _fundDeposit;
        initialBlock = _initialBlock;
        finalBlock = _finalBlock;
        exchangeRate = _exchangeRate;
    }

    function setThetaToken(address _token)
        non_zero_address(_token)
        only(admin)
        public {

        token = ThetaToken(_token);
        require(token.controller() == address(this)); // tokenSale is controller
    }

    // @notice The activate function needs to be called before the token sale starts
    function activateSale() only(admin) public {
        require(token.controller() == address(this));
        activated = true;
    }

    function deactivateSale() only(admin) public {
        activated = false;
    }

    // @noitce For token integration on platforms before the token sale
    function allowPrecirculation(address _addr) only(admin) public {
        token.allowPrecirculation(_addr);
    }

    function disallowPrecirculation(address _addr) only(admin) public {
        token.disallowPrecirculation(_addr);
    }

    function isPrecirculationAllowed(address _addr) constant public returns (bool) {
        return token.isPrecirculationAllowed(_addr);
    }    

    function setExchangeRate(uint _newExchangeRate) only(exchangeRateController) public {
        require(_newExchangeRate > 0);
        exchangeRate = _newExchangeRate;
    }

    function getFundCollected() only(admin) constant public returns (uint) {
        return fundCollected;
    }

    // @notice Token allocations for presale partners, only allowed before the sale starts
    function allocatePresaleTokens(address _recipient, uint _amount)
        only_before_sale
        non_zero_address(_recipient)
        only(admin)
        public {
        uint reserveAmount = calcReserve(_amount);
        require(token.mint(thetaLabsReserve, reserveAmount));
        require(token.mint(_recipient, _amount));
    }

    function isWhitelisted(address account) constant public returns (bool) {
        return whitelistMap[account];
    }

    // @notice Add accounts to the white list. Only whitelisted accounts can buy Theta tokens
    function addAccountsToWhitelist(address[] _accounts) only(whitelistController) public {
        for (uint i = 0; i < _accounts.length; i ++) {
            address account = _accounts[i];
            if (whitelistMap[account]) {
                continue;
            }
            whitelistMap[account] = true;
            Whitelist(account);
        }
    }
 
    function deleteAccountsFromWhitelist(address[] _accounts) only(whitelistController) public {
        for (uint i = 0; i < _accounts.length; i ++) {
            address account = _accounts[i];
            whitelistMap[account] = false;
            RemoveFromWhitelist(account);
        }
    }

    // @notice The default function called when ether is sent to the contract.
    function() public payable {
        doPayment(msg.sender);
    }

    // @notice `doPayment()` is an internal function that sends the received ether 
    // to the fund deposit address, and mints tokens for the purchaser
    function doPayment(address _owner)
        only_sale_activated
        only_during_sale_period
        only_sale_not_stopped
        non_zero_address(_owner)
        at_least(dust)
        internal {

        uint fundReceived = msg.value;
        require(fundCollected <= fundCollectedHardCap);

        // Calculate how many tokens bought
        uint boughtTokens = msg.value.mul(exchangeRate);

        // If past hard cap, throw
        uint tokenSoldAmount = token.totalSupply().mul(40).div(100); // 40% available for purchase
        require((tokenSoldAmount <= tokenSaleHardCap));
        require(whitelistMap[_owner]);

        // Send funds to fundDeposit
        require(fundDeposit.send(fundReceived));

        // Allocate tokens. This will fail after sale is finalized in case it is hidden cap finalized.
        uint reserveTokens = calcReserve(boughtTokens);
        require(token.mint(thetaLabsReserve, reserveTokens));
        require(token.mint(_owner, boughtTokens));

        // Save total collected amount
        fundCollected = fundCollected.add(msg.value);
    }

    // @notice Function to stop sale for an emergency.
    function emergencyStopSale()
        only_sale_activated
        only_sale_not_stopped
        only(admin)
        public {

        saleStopped = true;
    }

    // @notice Function to restart a stopped sale.
    function restartSale()
        only_sale_activated
        only_sale_stopped
        only(admin)
        public {

        saleStopped = false;
    }

    // @notice Function to finalize the token sale.
    // @dev Set the token controller to 0x00.
    function finalizeSale()
        only_after_sale
        only(root)
        public {

        // Sale yields token controller to address 0x00
        token.changeController(0);

        saleFinalized = true;
        saleStopped = true;
    }

    function changeThetaLabsReserve(address _newThetaLabsReserve) 
        non_zero_address(_newThetaLabsReserve)
        only(admin) public {
        thetaLabsReserve = _newThetaLabsReserve;
    }

    function changeFundDeposit(address _newFundDeposit) 
        non_zero_address(_newFundDeposit)
        only(admin) public {
        fundDeposit = _newFundDeposit;
    }

    function changeTokenSaleHardCap(uint _newTokenSaleHardCap) only(admin) public {
        tokenSaleHardCap = _newTokenSaleHardCap;
    }

    function changeFundCollectedHardCap(uint _newFundCollectedHardCap) only(admin) public {
        fundCollectedHardCap = _newFundCollectedHardCap;
    }

    function setEndTimeOfSale(uint _finalBlock) only(admin) public {
        require(_finalBlock > initialBlock);
        finalBlock = _finalBlock;
    }

    function setStartTimeOfSale(uint _initialBlock) only(admin) public {
        require(_initialBlock < finalBlock);
        initialBlock = _initialBlock;
    }

    function changeUnlockTime(uint _unlockTime) non_zero_address(address(token)) only(admin) public {
        token.changeUnlockTime(_unlockTime);
    }

    function changeRoot(address _newRoot)
        non_zero_address(_newRoot)
        only(root) public {
        require(_newRoot != admin);
        require(_newRoot != whitelistController);
        require(_newRoot != exchangeRateController);
        root = _newRoot;
    }

    function changeAdmin(address _newAdmin)
        non_zero_address(_newAdmin)
        only(root) public {
        require(_newAdmin != root);
        require(_newAdmin != whitelistController);
        require(_newAdmin != exchangeRateController);
        admin = _newAdmin;
    }

    function changeWhitelistController(address _newWhitelistController)
        non_zero_address(_newWhitelistController)
        only(admin) public {
        require(_newWhitelistController != root);
        require(_newWhitelistController != admin);
        whitelistController = _newWhitelistController;
    }

    function changeExchangeRateController(address _newExchangeRateController)
        non_zero_address(_newExchangeRateController)
        only(admin) public {
        require(_newExchangeRateController != root);
        require(_newExchangeRateController != admin);
        exchangeRateController = _newExchangeRateController;
    }

    function getBlockNumber() constant internal returns (uint) {
        return block.number;
    }

    function getRoot() constant public only(admin) returns (address) {
        return root;
    }

    function getAdmin() constant public only(admin) returns (address) {
        return admin;
    }

    function getWhitelistController() constant public only(admin) returns (address) {
        return whitelistController;
    }

    function getExchangeRateController() constant public only(admin) returns (address) {
        return exchangeRateController;
    }

    function getThetaLabsReserve() constant public only(admin) returns (address) {
        return thetaLabsReserve;
    }

    function getFundDeposit() constant public only(admin) returns (address) {
        return fundDeposit;
    }

    function calcReserve(uint _amount) pure internal returns(uint) {
        uint reserveAmount = _amount.mul(60).div(40);
        return reserveAmount;
    }

    modifier only(address x) {
        require(msg.sender == x);
        _;
    }

    modifier only_before_sale {
        require(getBlockNumber() < initialBlock);
        _;
    }

    modifier only_during_sale_period {
        require(getBlockNumber() >= initialBlock);
        require(getBlockNumber() < finalBlock);
        _;
    }

    modifier only_after_sale {
        require(getBlockNumber() >= finalBlock);
        _;
    }

    modifier only_sale_stopped {
        require(saleStopped);
        _;
    }

    modifier only_sale_not_stopped {
        require(!saleStopped);
        _;
    }

    modifier only_sale_activated {
        require(activated);
        _;
    }

    modifier non_zero_address(address x) {
        require(x != 0);
        _;
    }

    modifier at_least(uint x) {
        require(msg.value >= x);
        _;
    }
}
