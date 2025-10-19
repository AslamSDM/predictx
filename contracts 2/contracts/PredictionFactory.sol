// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IPredictionFactory } from "./interfaces/IPredictionFactory.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import { PredictionMarket } from "./PredictionMarket.sol";

/// @title PredictionFactory - Deployment hub and registry for prediction markets
/// @author PredictX
contract PredictionFactory is IPredictionFactory, Ownable, ReentrancyGuard {
    /// @notice Address of the Pyth contract used by predictions
    address public immutable pythContractAddress = 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21;
    address public immutable stakeToken =0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9 ;

    /// @notice Protocol fee percentage applied to losing pool for new predictions

    /// @notice Total number of created predictions (and latest id)
    uint256 public predictionCount;

    /// @notice Registry mapping from id to prediction address
    mapping(uint256 => address) public predictions;

    /// @notice Tracks predictions created by a user
    mapping(address => uint256[]) public userPredictions;

    constructor() Ownable(msg.sender) {}
    

    // owner() inherited from Ownable

    /// @notice Resolve Pyth feed id from an uppercased pair name like "ETHUSD"
    function _resolvePythFeedId(string memory pair) internal pure returns (bytes32) {
        bytes32 key = keccak256(abi.encodePacked(pair));
        if (key == keccak256(abi.encodePacked("1INCHUSD"))) return 0x63f341689d98a12ef60a5cff1d7f85c70a9e17bf1575f0e7c0b2512d48b1c8b3;
        if (key == keccak256(abi.encodePacked("AAVEUSD"))) return 0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445;
        if (key == keccak256(abi.encodePacked("BITCOINUSD"))) return 0xc5e0e0c92116c0c070a242b254270441a6201af680a33e0381561c59db3266c9;
        if (key == keccak256(abi.encodePacked("BNBUSD"))) return 0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f;
        if (key == keccak256(abi.encodePacked("ETHUSD"))) return 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
        revert("Unsupported pair");
    }

    /// @notice Create a new prediction market instance
    /// @param _pairName Human-readable pair name
    /// @param _direction Direction of the prediction (Up or Down)
    /// @param _targetPrice Target price (8 decimals)
    /// @param _endTime Market end time (future)
    /// @param _metadataURI Optional metadata URI
    /// @param _initialLiquidity Initial PYUSD liquidity amount
    /// @param _initialTokenValue Initial token value in PYUSD
    /// @param _percentageToLock Percentage of tokens to lock for creator (1-99)
    function createPrediction(
        string memory _pairName,
        PredictionMarket.Direction _direction,
        uint256 _targetPrice,
        uint256 _endTime,
        string memory _metadataURI,
        uint256 _initialLiquidity,
        uint256 _initialTokenValue,
        uint8 _percentageToLock
    ) external override returns (address) {
        require(_endTime > block.timestamp, "End must be future");
        require(!(_endTime - block.timestamp > 2 days), "End must be less than 2 days from now");
        require(_initialLiquidity > 0, "Initial liquidity must be greater than 0");
        require(_initialTokenValue > 0, "Initial token value must be greater than 0");
        // Initial probability is hardcoded to 50% (50)
        require(_percentageToLock > 0 && _percentageToLock < 100, "Invalid percentage to lock");
        
        bytes32 feedId = _resolvePythFeedId(_pairName);

        PredictionMarket newPrediction = new PredictionMarket(
            msg.sender,
            address(this),
            _pairName,
            stakeToken,
            _direction,
            feedId,
            _targetPrice,
            _endTime,
            _metadataURI,
            _initialLiquidity,
            _initialTokenValue,
            50,
            _percentageToLock
        );

        predictionCount += 1;
        predictions[predictionCount] = address(newPrediction);
        userPredictions[msg.sender].push(predictionCount);

        emit PredictionCreated(predictionCount, msg.sender, address(newPrediction), _endTime, _targetPrice);
        return address(newPrediction);
    }

    /// @notice Withdraw accumulated protocol fees (ERC20 or ETH) to the owner
    /// @param token Address of ERC20 token to withdraw, or address(0) for ETH
    function withdrawProtocolFees(address token) external override onlyOwner nonReentrant {
        if (token == address(0)) {
            uint256 ethBal = address(this).balance;
            require(ethBal > 0, "No ETH fees");
            (bool success, ) = payable(owner()).call{ value: ethBal }("");
            require(success, "ETH withdraw failed");
        } else {
            uint256 bal = IERC20(token).balanceOf(address(this));
            require(bal > 0, "No token fees");
            require(IERC20(token).transfer(owner(), bal), "Token withdraw failed");
        }
    }

    /// @notice Returns list of prediction ids created by user
    function getUserPredictions(address _user) external view override returns (uint256[] memory) {
        return userPredictions[_user];
    }

    /// @notice Returns outcome of a specific prediction
    function getPredictionOutcome(uint256 _predictionId) external view override returns (PredictionMarket.Outcome) {
        address predAddr = predictions[_predictionId];
        require(predAddr != address(0), "Invalid id");
        return PredictionMarket(predAddr).outcome();
    }

}


