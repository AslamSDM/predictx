// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IPrediction } from "./interfaces/IPrediction.sol";
import { IPredictionFactory } from "./interfaces/IPredictionFactory.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/// @title Prediction - A single decentralized prediction market instance
/// @author PredictX
/// @notice Users stake ETH on whether an asset price will be above/below a target at end time; resolution uses Pyth oracle
contract Prediction is IPrediction, ReentrancyGuard {
    /// @notice The address that created this prediction
    address public immutable creator;
    /// @notice The factory contract that deployed this prediction
    address public immutable factory;



    /// @notice The fee percentage applied to the losing pool at resolution
    /// @dev e.g., 5 for 5%
    uint256 public immutable feePercentage; // 5% 2% for protocol 2% for creator 1% for liquidator

    /// @notice ERC20 token used for staking in this prediction
    address public immutable stakeToken;

    /// @notice Direction of the prediction (Up: price increases to target; Down: price decreases to target)
    Direction public immutable direction;

    /// @notice Human readable asset pair name (e.g., "BTC/USD")
    string public pairName;

    /// @notice Pyth Network price feed id for the asset
    bytes32 public pythPriceFeedId;

    /// @notice Target price in 8 decimals to compare against
    uint256 public targetPrice;

    /// @notice Creation timestamp
    uint256 public immutable startTime;

    /// @notice Market end timestamp (no more voting, eligible for resolution)
    uint256 public immutable endTime;

    /// @notice Optional metadata URI (e.g., IPFS CID)
    string public metadataURI;

    /// @notice Current lifecycle status of the prediction
    Status public status;

    /// @notice Final outcome after resolution
    Outcome public outcome;

    /// @notice Total ETH in the YES pool
    uint256 public yesPool;

    /// @notice Total ETH in the NO pool
    uint256 public noPool;

    uint256 public totalPool;
    uint256 public totalFees;

    /// @notice Per-user stake in YES
    mapping(address => uint256) public yesVotes;

    /// @notice Per-user stake in NO
    mapping(address => uint256) public noVotes;

    /// @notice Tracks whether a user already claimed their winnings/refund
    mapping(address => bool) public hasClaimed;

    /// @notice Ensures only the creator can call
    modifier onlyCreator() {
        require(msg.sender == creator, "Not creator");
        _;
    }

    /// @notice Ensures only the factory can call
    modifier onlyFactory() {
        require(msg.sender == factory, "Not factory");
        _;
    }
    

    /// @notice Deploy a new prediction market; callable only by the PredictionFactory
    /// @param _creator The market creator address
    /// @param _factory The factory deploying this instance
    /// @param _feePercentage Fee percentage applied to losing pool at resolution
    /// @param _pairName Human-readable pair name
    /// @param _stakeToken ERC20 token used for staking
    /// @param _direction Direction of the prediction (Up or Down)
    /// @param _pythPriceFeedId Pyth price feed id
    /// @param _targetPrice Target price with 8 decimals
    /// @param _endTime Market end timestamp (must be in the future)
    /// @param _metadataURI Optional metadata URI
    constructor(
        address _creator,
        address _factory,
        uint256 _feePercentage,
        string memory _pairName,
        address _stakeToken,
        Direction _direction,
        bytes32 _pythPriceFeedId,
        uint256 _targetPrice,
        uint256 _endTime,
        string memory _metadataURI
    ) {
        require(_factory != address(0), "Factory zero");
        require(_creator != address(0), "Creator zero");
        require(_stakeToken != address(0), "Token zero");
        require(_endTime > block.timestamp, "End must be future");

        creator = _creator;
        factory = _factory;
        feePercentage = _feePercentage;
        stakeToken = 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9;
        direction = _direction;
        pairName = _pairName;
        pythPriceFeedId = _pythPriceFeedId;
        targetPrice = _targetPrice;
        startTime = block.timestamp;
        endTime = _endTime;
        metadataURI = _metadataURI;

        status = Status.Open;
        outcome = Outcome.Undetermined;
    }

    /// @notice Stake ETH to vote on the outcome
    /// @param _supportsOutcome true for YES, false for NO
    /// @param amount token amount to stake
    function vote(bool _supportsOutcome, uint256 amount) external override nonReentrant {
        require(status == Status.Open, "Not open");
        require(block.timestamp < endTime, "Voting closed");
        require(amount > 0, "No amount");
        require(yesVotes[msg.sender] + noVotes[msg.sender] == 0, "Already voted");
        // Effects
        if (_supportsOutcome) {
            yesPool += amount;
            yesVotes[msg.sender] += amount;
        } else {
            noPool += amount;
            noVotes[msg.sender] += amount;
        }

        // Interactions: transfer tokens from user to this contract
        require(IERC20(stakeToken).transferFrom(msg.sender, address(this), amount), "TransferFrom failed");

        emit Voted(msg.sender, _supportsOutcome, amount);
    }

    function transferVotes() public nonReentrant {
        require(status == Status.Open, "Not open");
        require(block.timestamp < endTime, "Voting closed");
        require(yesVotes[msg.sender] + noVotes[msg.sender] >0, "You havent voted yet");
        if(yesVotes[msg.sender] > 0){
            noVotes[msg.sender] += yesVotes[msg.sender];
            yesPool -= yesVotes[msg.sender];
            noPool += yesVotes[msg.sender];
            yesVotes[msg.sender] = 0;
            emit VotesTransferred(msg.sender, Outcome.No, noVotes[msg.sender]);
        } else {
            yesVotes[msg.sender] += noVotes[msg.sender];
            noPool -= noVotes[msg.sender];
            yesPool += noVotes[msg.sender];
            noVotes[msg.sender] = 0;
            emit VotesTransferred(msg.sender, Outcome.Yes, yesVotes[msg.sender]);
        }
    }

    function  increaseVotes(Outcome _supportsOutcome, uint256 amount) external nonReentrant {
        require(status == Status.Open, "Not open");
        require(_supportsOutcome == Outcome.Yes || _supportsOutcome == Outcome.No, "Invalid side");
        require(block.timestamp < (startTime + (endTime-startTime)/2), "Cannot increase votes after half of the market time");
        require(amount > 0, "No amount");
        require(yesVotes[msg.sender] + noVotes[msg.sender] > 0, "You havent voted yet");
        if(_supportsOutcome == Outcome.Yes){
            require(yesVotes[msg.sender] > 0, "You already voted no");
            yesVotes[msg.sender] += amount;
            yesPool += amount;
        } else {
            require(noVotes[msg.sender] > 0, "You already voted yes");
            noVotes[msg.sender] += amount;
            noPool += amount;
        }
        require(IERC20(stakeToken).transferFrom(msg.sender, address(this), amount), "TransferFrom failed");
        emit VotesIncreased(msg.sender, _supportsOutcome, amount);
    }

    function resolvePrediction(
        bytes[] calldata _priceUpdateData,
        bytes[] calldata _highPriceUpdateData,
        bytes[] calldata _lowPriceUpdateData
    ) external payable nonReentrant {
        require(status == Status.Open, "Prediction: Not open");
        require(block.timestamp > endTime, "Prediction: Too early to resolve");

        // Step 1: Update Pyth feeds and get the contract instance
        PythStructs.PriceFeed[] memory priceFeeds = _update_and_validate(_highPriceUpdateData, _lowPriceUpdateData);
        if(direction == Direction.Up){
            if(_normalizeTo8(uint256(int256(priceFeeds[0].price.price)), priceFeeds[0].price.expo) >= targetPrice){
                outcome = Outcome.Yes;
            } else {
                outcome = Outcome.No;
            }
        }
        if(direction == Direction.Down){
            if(_normalizeTo8(uint256(int256(priceFeeds[1].price.price)), priceFeeds[1].price.expo) <= targetPrice){
                outcome = Outcome.Yes;
            } else {
                outcome = Outcome.No;
            }
        }


        // Step 4: Distribute fees from the losing pool
        _distributeFees(outcome);
        status = Status.Resolved;
        // Step 5:update the price on smart contract
        IPyth pyth = IPyth(IPredictionFactory(factory).pythContractAddress());
        uint256 updatefees = pyth.getUpdateFee(_priceUpdateData);
        pyth.updatePriceFeeds{ value: updatefees }(_priceUpdateData);
        PythStructs.Price memory priceNow = pyth.getPriceNoOlderThan(pythPriceFeedId, 60);
        emit PredictionResolved(outcome, _normalizeTo8(uint256(int256(priceNow.price)), priceNow.expo));
    }



    /// @dev Updates the on-chain Pyth price data using the provided blobs.
    function _update_and_validate (
        bytes[] calldata _highPriceUpdateData,
        bytes[] calldata _lowPriceUpdateData
    ) private nonReentrant returns (PythStructs.PriceFeed[] memory ) {
        IPyth pyth = IPyth(IPredictionFactory(factory).pythContractAddress());
        uint256 highfees = pyth.getUpdateFee(_highPriceUpdateData);
        uint256 lowfees = pyth.getUpdateFee(_lowPriceUpdateData);
        require(msg.value >=( highfees + (lowfees * 2)), "Insufficient funds"); //*2 just to incorporate updation fee also
        bytes32[] memory priceIds = new bytes32[](1);
        priceIds[0] = pythPriceFeedId;
        uint64 minPublishTime = uint64(startTime);
        uint64 maxPublishTime = uint64(endTime);
        PythStructs.PriceFeed[] memory priceFeeds = new PythStructs.PriceFeed[](2);

        priceFeeds[0] = pyth.parsePriceFeedUpdates{value: highfees}(
            _highPriceUpdateData,
            priceIds,
            minPublishTime,
            maxPublishTime
        )[0];
        priceFeeds[1]= pyth.parsePriceFeedUpdates{value: lowfees}(
            _lowPriceUpdateData,
            priceIds,
            minPublishTime,
            maxPublishTime
        )[0];

        return priceFeeds;

    }


    /// @dev Calculates and distributes fees from the losing pool.
    /// @param _finalOutcome The resolved outcome of the prediction.
    function _distributeFees(Outcome _finalOutcome) private {
        uint256 losingPool = (_finalOutcome == Outcome.Yes) ? noPool : yesPool;
        totalPool = yesPool + noPool;
        totalFees = (totalPool * feePercentage) / 100;

        if (totalFees > 0) {
            uint256 creatorFee = outcome == Outcome.Yes ? ((totalFees  * 2)/5 ) : 0; // fees for the creator if and only if the outcome is yes
            uint256 liquidatorFee = ((totalFees  * 1)/5 ) ; 
            uint256 protocolFee = totalFees - ( creatorFee + liquidatorFee); 

            if (creatorFee > 0) {
                require(IERC20(stakeToken).transfer(creator, creatorFee), "Prediction: Creator fee transfer failed");
            }
            if (protocolFee > 0) {
                require(IERC20(stakeToken).transfer(factory, protocolFee), "Prediction: Protocol fee transfer failed");
            }
            if(liquidatorFee > 0){
                require(IERC20(stakeToken).transfer(msg.sender, liquidatorFee), "Prediction: Liquidator fee transfer failed");
            }
        }
    }

    /// @notice Claim winnings for users on the winning side after resolution
    function claimWinnings() external override nonReentrant {
        require(status == Status.Resolved, "Not resolved");
        require(!hasClaimed[msg.sender], "Already claimed");

        bool isYesWinner = (outcome == Outcome.Yes);
        uint256 userStake = isYesWinner ? yesVotes[msg.sender] : noVotes[msg.sender];
        require(userStake > 0, "No winning stake");

        uint256 winningPool = isYesWinner ? yesPool : noPool;
        uint256 distributable = totalPool - totalFees;

        // Pro-rata share
        uint256 payout = (distributable * userStake) / winningPool;
        hasClaimed[msg.sender] = true;

        require(IERC20(stakeToken).transfer(msg.sender, payout), "Payout failed");

        emit WinningsClaimed(msg.sender, payout);
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


