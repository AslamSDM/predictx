//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { PredictionMarketToken } from "./PredictionMarketToken.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IPredictionFactory } from "./interfaces/IPredictionFactory.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
contract PredictionMarket is Ownable, ReentrancyGuard {
    /////////////////
    /// Errors //////
    /////////////////

    error PredictionMarket__PredictionAlreadyReported();
    error PredictionMarket__OwnerCannotCall();
    error PredictionMarket__PredictionNotReported();
    error PredictionMarket__InsufficientWinningTokens();
    error PredictionMarket__AmountMustBeGreaterThanZero();
    error PredictionMarket__InsufficientTokenReserve(Outcome _outcome, uint256 _amountToken);
    error PredictionMarket__TokenTransferFailed();
    error PredictionMarket__InsufficientBalance(uint256 _tradingAmount, uint256 _userBalance);
    error PredictionMarket__InsufficientAllowance(uint256 _tradingAmount, uint256 _allowance);
    error PredictionMarket__InsufficientLiquidity();
    error PredictionMarket__MarketNotInitialized();
    error PredictionMarket__MarketAlreadyInitialized();
    error PredictionMarket__MarketNotEnded();

    enum Outcome {
        YES,
        NO,
        Undetermined
    }
    enum Direction { Up, Down }
    enum Status {
        NOT_INITIALIZED,
        ONE_TOKEN_MINTED,
        TWO_TOKEN_MINTED,
        MARKET_INITIALIZED,
         HIGHPRICE_RESOLVED,
         LOWPRICE_RESOLVED, 
         PRICE_UPDATED
          }


    uint256 private constant PRECISION = 1e6;
    uint256 private constant PYUSD_DECIMALS = 6;
    
    uint256 public initialTokenValue = 10000;
    uint8 public initialYesProbability = 50;
    uint8 public percentageToLock = 10;
    uint256 public pyUSD;
    uint256 public lpTradingRevenue;
    PredictionMarketToken public yesToken;
    PredictionMarketToken public noToken;


 
    bool public isReported=false;
    PredictionMarketToken public winningToken;

    Status public status;
    Outcome public outcome;
    uint256 public startTime;
    uint256 public endTime;
    string public metadataURI;
    address public immutable stakeToken = 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9; //PYUSD
    address public immutable pythContractAddress = 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21;
    Direction public direction;
    bytes32 public pythPriceFeedId;
    uint256 public targetPrice;
    string public pairName;
    address public factory;
    address public creator;

    PythStructs.PriceFeed public highPriceFeed;
    PythStructs.PriceFeed public lowPriceFeed;
    PythStructs.PriceFeed public updatePriceFeed;

    event TokensPurchased(address indexed buyer, Outcome outcome, uint256 amount, uint256 ethAmount);
    event TokensSold(address indexed seller, Outcome outcome, uint256 amount, uint256 ethAmount);
    event WinningTokensRedeemed(address indexed redeemer, uint256 amount, uint256 ethAmount);
    event MarketReported(address indexed resolver, Outcome winningOutcome, address winningToken);
    event CurrentPairTokenPrice(uint256  price);
    event MarketResolved(address indexed resolver, uint256 totalEthToSend);
    event LiquidityAdded(address indexed provider, uint256 ethAmount, uint256 tokensAmount);
    event LiquidityRemoved(address indexed provider, uint256 ethAmount, uint256 tokensAmount);



    modifier predictionNotReported() {
        if (isReported) {
            revert PredictionMarket__PredictionAlreadyReported();
        }
        _;
    }


    modifier predictionReported() {
        if (!isReported) {
            revert PredictionMarket__PredictionNotReported();
        }
        _;
    }

  
    modifier notOwner() {
        if (msg.sender == owner()) {
            revert PredictionMarket__OwnerCannotCall();
        }
        _;
    }
    
    modifier amountGreaterThanZero(uint256 _amount) {
        if (_amount == 0) {
            revert PredictionMarket__AmountMustBeGreaterThanZero();
        }
        _;
    }

    modifier marketInitialized() {
        if (status != Status.MARKET_INITIALIZED) {
            revert PredictionMarket__MarketNotInitialized();
        }
        _;
    }



    constructor(
        address _creator,
        address _factory,
        string memory _pairName,
        Direction _direction,
        bytes32 _pythPriceFeedId,
        uint256 _targetPrice,
        uint256 _endTime,
        string memory _metadataURI,
        uint256 _initialLiquidity
    ) Ownable(_creator) {

        pythPriceFeedId = _pythPriceFeedId;
        targetPrice = _targetPrice;
        endTime = _endTime;
        metadataURI = _metadataURI;
        startTime = block.timestamp;
        direction = _direction; //Up or Down
        pairName = _pairName;
        status = Status.NOT_INITIALIZED;
        outcome = Outcome.Undetermined;
        creator = _creator;
        factory = _factory;

        pyUSD = _initialLiquidity;
       
    }
    function initializeNoToken() external onlyOwner {
if (status != Status.NOT_INITIALIZED && status != Status.ONE_TOKEN_MINTED) {
    revert PredictionMarket__MarketAlreadyInitialized();
}
        uint256 initialTokenAmount = (pyUSD/initialTokenValue)*PRECISION;
        noToken = new PredictionMarketToken(
            "NO", 
            "NO",
            creator,
            (initialTokenAmount)
        );
        status = status == Status.NOT_INITIALIZED ? Status.ONE_TOKEN_MINTED : Status.TWO_TOKEN_MINTED;
        }

    function initializeYesToken() external onlyOwner {
if (status != Status.NOT_INITIALIZED && status != Status.ONE_TOKEN_MINTED) {
    revert PredictionMarket__MarketAlreadyInitialized();
}
        uint256 initialTokenAmount = (pyUSD/initialTokenValue)*PRECISION;
        yesToken = new PredictionMarketToken(
            "YES",
            "YES",
           creator,
            (initialTokenAmount)
        );
        status = status == Status.NOT_INITIALIZED ? Status.ONE_TOKEN_MINTED : Status.TWO_TOKEN_MINTED;
    }
    
    function initializeMarket() external onlyOwner {
        if (status != Status.TWO_TOKEN_MINTED) {
            revert PredictionMarket__MarketNotInitialized();
        }
        require(IERC20(stakeToken).allowance(creator, address(this)) >= pyUSD, "Insufficient allowance");
        require(IERC20(stakeToken).transferFrom(creator, address(this), pyUSD), "Transfer failed");
        uint256 initialTokenAmount = (pyUSD/initialTokenValue)*PRECISION;
        uint256 initialYesAmountLocked = (initialTokenAmount * initialYesProbability * percentageToLock * 2) / 10000;
        uint256 initialNoAmountLocked = (initialTokenAmount * (100 - initialYesProbability) * percentageToLock * 2) / 10000;
        yesToken.transfer(creator, initialYesAmountLocked);
        noToken.transfer(creator, initialNoAmountLocked);
        status = Status.MARKET_INITIALIZED;
        isReported = false;
    }



    function addLiquidity(uint256 _PYUSDAmount) external onlyOwner  {

        if (isReported) {
            revert PredictionMarket__PredictionAlreadyReported();
        }

        if (_PYUSDAmount == 0) {
            revert PredictionMarket__AmountMustBeGreaterThanZero();
        }
        require(IERC20(stakeToken).balanceOf(msg.sender) >= _PYUSDAmount, "Insufficient balance");
        require(IERC20(stakeToken).allowance(msg.sender, address(this)) >= _PYUSDAmount, "Insufficient allowance");
        require(IERC20(stakeToken).transferFrom(msg.sender, address(this), _PYUSDAmount), "Transfer failed");
        
        uint256 tokenAmount =( _PYUSDAmount/initialTokenValue)*PRECISION;
        
        pyUSD += _PYUSDAmount;
        
        yesToken.mint(address(this), tokenAmount);
        noToken.mint(address(this), tokenAmount);
        
        emit LiquidityAdded(msg.sender, _PYUSDAmount, tokenAmount);
    }


    function removeLiquidity(uint256 PYUSDToWithdraw) external onlyOwner {
      
        if (isReported) {
            revert PredictionMarket__PredictionAlreadyReported();
        }
        
        uint256 tokenAmount = (PYUSDToWithdraw/initialTokenValue)*PRECISION;
        
        if (yesToken.balanceOf(address(this)) < tokenAmount || noToken.balanceOf(address(this)) < tokenAmount) {
            revert PredictionMarket__InsufficientTokenReserve(Outcome.YES, tokenAmount);
        }
        
        pyUSD -= PYUSDToWithdraw;
        
        yesToken.burn(address(this), tokenAmount);
        noToken.burn(address(this), tokenAmount);
        
        IERC20(stakeToken).transfer(msg.sender, PYUSDToWithdraw);
        
        emit LiquidityRemoved(msg.sender, PYUSDToWithdraw, tokenAmount);
    }




    function _update_and_validate (
            bytes[] calldata _priceUpdateData
    ) private nonReentrant returns (PythStructs.PriceFeed memory ) {
        IPyth pyth = IPyth(pythContractAddress);
        uint256 fees = pyth.getUpdateFee(_priceUpdateData);
        require(msg.value >= fees, "Insufficient funds"); //*2 just to incorporate updation fee also
        bytes32[] memory priceIds = new bytes32[](1);
        priceIds[0] = pythPriceFeedId;
        uint64 minPublishTime = uint64(startTime);
        uint64 maxPublishTime = uint64(endTime);
        PythStructs.PriceFeed memory priceFeed;

        priceFeed = pyth.parsePriceFeedUpdates{value: fees}(
            _priceUpdateData,
            priceIds,
            minPublishTime,
            maxPublishTime
        )[0];
        return priceFeed;

    }

    //first send high price update data
    //then send low price update data
    //then send update price data
    function report(bytes[] calldata _priceUpdateData) external payable nonReentrant  {

        if (isReported) {
            revert PredictionMarket__PredictionAlreadyReported();
        }
        if(block.timestamp  < endTime){
            revert PredictionMarket__MarketNotEnded();
        }
        if(status == Status.MARKET_INITIALIZED){
            //resolve high price feed and update status to HIGHPRICE_RESOLVED
            highPriceFeed = _update_and_validate(_priceUpdateData);
            status = Status.HIGHPRICE_RESOLVED;
            return;
        }
        if(status == Status.HIGHPRICE_RESOLVED){
            //resolve low price feed and update status to LOWPRICE_RESOLVED
            lowPriceFeed = _update_and_validate(_priceUpdateData);
            status = Status.LOWPRICE_RESOLVED;
            return;
        }
        if(status == Status.LOWPRICE_RESOLVED){
            //update price feed and update status to PRICE_UPDATED
            isReported = true;

            if(direction == Direction.Up){
            if(_normalizeTo8(uint256(int256(highPriceFeed.price.price)), highPriceFeed.price.expo) >= targetPrice){
                outcome = Outcome.YES;
                winningToken = yesToken;
            } else {
                outcome = Outcome.NO;
                winningToken = noToken;
            }
        }
        if(direction == Direction.Down){
            if(_normalizeTo8(uint256(int256(lowPriceFeed.price.price)), lowPriceFeed.price.expo) <= targetPrice){
                outcome = Outcome.YES;
                winningToken = yesToken;
            } else {
                outcome = Outcome.NO;
                winningToken = noToken;
            }
        }
        IPyth pyth = IPyth(pythContractAddress);
        uint256 updatefees = pyth.getUpdateFee(_priceUpdateData);
        pyth.updatePriceFeeds{ value: updatefees }(_priceUpdateData);
        PythStructs.Price memory priceNow = pyth.getPriceNoOlderThan(pythPriceFeedId, 60);
        emit MarketReported(msg.sender, outcome, address(winningToken));
        emit CurrentPairTokenPrice(_normalizeTo8(uint256(int256(priceNow.price)), priceNow.expo));
        status = Status.PRICE_UPDATED;
        return;
        }
    }
   


    function resolveMarketAndWithdraw() external onlyOwner returns (uint256)  {
      
        if (!isReported) {
            revert PredictionMarket__PredictionNotReported();
        }
        
        uint256 winningTokens = winningToken.balanceOf(address(this));
        uint256 PYUSDFromWinningTokens = (winningTokens*initialTokenValue)/(10**PYUSD_DECIMALS);
        
        winningToken.burn(address(this), winningTokens);
        
        require(IERC20(stakeToken).transfer(msg.sender, PYUSDFromWinningTokens), "Transfer failed");
        
        emit MarketResolved(msg.sender, PYUSDFromWinningTokens);
        
        return PYUSDFromWinningTokens;
    }

    /**
     * @notice Buy prediction outcome tokens with ETH, need to call priceInETH function first to get right amount of tokens to buy
     * @param _outcome The possible outcome (YES or NO) to buy tokens for
     * @param _amountTokenToBuy Amount of tokens to purchase
     */
    function buyTokensWithPYUSD(Outcome _outcome, uint256 _amountTokenToBuy) external  predictionNotReported notOwner amountGreaterThanZero(_amountTokenToBuy) {
      
        uint256 requiredPYUSD = getBuyPriceInPYUSD(_outcome, _amountTokenToBuy);
        
        require(IERC20(stakeToken).balanceOf(msg.sender) >= requiredPYUSD, "Insufficient PYUSD balance");
        require(IERC20(stakeToken).allowance(msg.sender, address(this)) >= requiredPYUSD, "Insufficient PYUSD allowance");
        require(IERC20(stakeToken).transferFrom(msg.sender, address(this), requiredPYUSD), "PYUSD transfer failed");
        
        PredictionMarketToken token = _outcome == Outcome.YES ? yesToken : noToken;
        
        bool success = token.transfer(msg.sender, _amountTokenToBuy);
        if (!success) {
            revert PredictionMarket__TokenTransferFailed();
        }
        
        emit TokensPurchased(msg.sender, _outcome, _amountTokenToBuy, requiredPYUSD);
    }


    function sellTokensForPYUSD(Outcome _outcome, uint256 _tradingAmount) external predictionNotReported notOwner amountGreaterThanZero(_tradingAmount) {
     
        PredictionMarketToken token = _outcome == Outcome.YES ? yesToken : noToken;
        
        if (token.balanceOf(msg.sender) < _tradingAmount) {
            revert PredictionMarket__InsufficientBalance(_tradingAmount, token.balanceOf(msg.sender));
        }
        
        if (token.allowance(msg.sender, address(this)) < _tradingAmount) {
            revert PredictionMarket__InsufficientAllowance(_tradingAmount, token.allowance(msg.sender, address(this)));
        }
        
        uint256 PYUSDToRecieve = getSellPriceInPYUSD(_outcome, _tradingAmount);
        
        bool success = token.transferFrom(msg.sender, address(this), _tradingAmount);
        if (!success) {
            revert PredictionMarket__TokenTransferFailed();
        }
        require(IERC20(stakeToken).transfer(msg.sender, PYUSDToRecieve), "Transfer failed");
        emit TokensSold(msg.sender, _outcome, _tradingAmount, PYUSDToRecieve);
    }
    
    function redeemWinningTokens(uint256 _amount) external predictionReported notOwner amountGreaterThanZero(_amount) {
     
        if (winningToken.balanceOf(msg.sender) < _amount) {
            revert PredictionMarket__InsufficientWinningTokens();
        }
        
        uint256 PYUSDToRecieve = (_amount * initialTokenValue) / (10**PYUSD_DECIMALS);
        
        pyUSD -= PYUSDToRecieve;
        
        winningToken.burn(msg.sender, _amount);
        
        require(IERC20(stakeToken).transfer(msg.sender, PYUSDToRecieve), "Transfer failed");
        
        emit WinningTokensRedeemed(msg.sender, _amount, PYUSDToRecieve);
    }


    function getBuyPriceInPYUSD(Outcome _outcome, uint256 _tradingAmount) public view returns (uint256) {
       
        return _calculatePriceINPYUSD(_outcome, _tradingAmount, false);
    }

  
    function getSellPriceInPYUSD(Outcome _outcome, uint256 _tradingAmount) public view returns (uint256) {
      
        return _calculatePriceINPYUSD(_outcome, _tradingAmount, true);
    }

    /////////////////////////
    /// Helper Functions ///
    ////////////////////////

    function _calculatePriceINPYUSD(
        Outcome _outcome,
        uint256 _tradingAmount,
        bool _isSelling
    ) private view returns (uint256) {

        (uint256 currentTokenReserve, uint256 currentOtherTokenReserve) = _getCurrentReserves(_outcome);
        
        if (!_isSelling) {
            // When buying, we check if we have enough tokens to sell
            if (currentTokenReserve < _tradingAmount) {
                revert PredictionMarket__InsufficientLiquidity();
            }
        }
        
        // Calculate initial token amount (total supply)
        uint256 initialTokenAmount = (pyUSD/initialTokenValue)*PRECISION;
        
        // Calculate current tokens sold
        uint256 currentTokenSoldBefore = initialTokenAmount - currentTokenReserve;
        uint256 currentOtherTokenSold = initialTokenAmount - currentOtherTokenReserve;
        uint256 totalTokensSoldBefore = currentTokenSoldBefore + currentOtherTokenSold;
        
        uint256 probabilityBefore = _calculateProbability(currentTokenSoldBefore, totalTokensSoldBefore);
        
        uint256 currentTokenSoldAfter;
        uint256 totalTokensSoldAfter;
        
        if (_isSelling) {
            // When selling, tokens go back to reserve, so sold amount decreases
            currentTokenSoldAfter = currentTokenSoldBefore - _tradingAmount;
            totalTokensSoldAfter = totalTokensSoldBefore - _tradingAmount;
        } else {
            // When buying, tokens leave reserve, so sold amount increases
            currentTokenSoldAfter = currentTokenSoldBefore + _tradingAmount;
            totalTokensSoldAfter = totalTokensSoldBefore + _tradingAmount;
        }
        
        uint256 probabilityAfter = _calculateProbability(currentTokenSoldAfter, totalTokensSoldAfter);
        uint256 probabilityAvg = (probabilityBefore + probabilityAfter) / 2;
        
        return (initialTokenValue  * probabilityAvg * _tradingAmount) / (PRECISION *PRECISION );
    }

    /**
     * @dev Internal helper to get the current reserves of the tokens
     * @param _outcome The possible outcome (YES or NO)
     * @return The current reserves of the tokens
     */
    function _getCurrentReserves(Outcome _outcome) private view returns (uint256, uint256) {
      
        if (_outcome == Outcome.YES) {
            return (yesToken.balanceOf(address(this)), noToken.balanceOf(address(this)));
        } else {
            return (noToken.balanceOf(address(this)), yesToken.balanceOf(address(this)));
        }
    }

    /**
     * @dev Internal helper to calculate the probability of the tokens
     * @param tokensSold The number of tokens sold
     * @param totalSold The total number of tokens sold
     * @return The probability of the tokens
     */
    function _calculateProbability(uint256 tokensSold, uint256 totalSold) private pure returns (uint256) {
      
        if (totalSold == 0) {
            return PRECISION / 2; // 50% if no tokens sold
        }
        return (tokensSold * PRECISION) / totalSold;
    }

    /// @notice Normalize a Pyth price to 8 decimals
    /// @param priceAbs Absolute value of the price (must be positive)
    /// @param expo The exponent provided by Pyth (e.g., -8)
    /// @return normalizedPrice Price scaled to 8 decimals
    function _normalizeTo8(uint256 priceAbs, int32 expo) internal pure returns (uint256 normalizedPrice) {
        // Target exponent is -8
        if (expo == -8) {
            return priceAbs;
        } else if (expo < -8) {
            uint32 divExp = uint32(uint32(-8 - expo));
            return priceAbs / _pow10(divExp);
        } else {
            // expo > -8
            uint32 mulExp = uint32(uint32(expo - (-8)));
            return priceAbs * _pow10(mulExp);
        }
    }

    /// @notice 10^exp helper
    function _pow10(uint32 exp) internal pure returns (uint256) {
        uint256 result = 1;
        for (uint32 i = 0; i < exp; i++) {
            result *= 10;
        }
        return result;
    }
}