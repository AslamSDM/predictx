// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IPrediction } from "./interfaces/IPrediction.sol";
import { IPredictionFactory } from "./interfaces/IPredictionFactory.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import { Prediction } from "./Prediction.sol";

/// @title PredictionFactory - Deployment hub and registry for prediction markets
/// @author PredictX
contract PredictionFactory is IPredictionFactory, Ownable, ReentrancyGuard {
    /// @notice Address of the Pyth contract used by predictions
    address public immutable pythContractAddress;
    address public immutable stakeToken;

    /// @notice Protocol fee percentage applied to losing pool for new predictions
    uint256 public protocolFeePercentage=5;

    /// @notice Total number of created predictions (and latest id)
    uint256 public predictionCount;

    /// @notice Registry mapping from id to prediction address
    mapping(uint256 => address) public predictions;

    /// @notice Tracks predictions created by a user
    mapping(address => uint256[]) public userPredictions;
    constructor(address _pyth, address _stakeToken, uint256 _feePct) Ownable(msg.sender) {
        require(_pyth != address(0) && _stakeToken != address(0), "zero addr");
        require(_feePct <= 100, "fee too high");
        pythContractAddress = _pyth;
        stakeToken = _stakeToken;
        protocolFeePercentage = _feePct;
    }

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
    /// @param _targetPrice Target price (8 decimals)
    /// @param _endTime Market end time (future)
    /// @param _metadataURI Optional metadata URI
    function createPrediction(
        string memory _pairName,
        IPrediction.Direction _direction,
        uint256 _targetPrice,
        uint256 _endTime,
        string memory _metadataURI
    ) external override returns (address) {
        require(_endTime > block.timestamp, "End must be future");
        require(!(_endTime - block.timestamp > 2 days), "End must be less than 2 days from now");
        bytes32 feedId = _resolvePythFeedId(_pairName);

        Prediction newPrediction = new Prediction(
            msg.sender,
            address(this),
            protocolFeePercentage,
            _pairName,
            stakeToken,
            _direction,
            feedId,
            _targetPrice,
            _endTime,
            _metadataURI
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
    function getPredictionOutcome(uint256 _predictionId) external view override returns (IPrediction.Outcome) {
        address predAddr = predictions[_predictionId];
        require(predAddr != address(0), "Invalid id");
        return IPrediction(predAddr).outcome();
    }

    /// @notice Update the protocol fee percentage for future predictions
    function setFeePercentage(uint256 _newFee) external override onlyOwner {
        require(_newFee <= 100, "Fee too high");
        protocolFeePercentage = _newFee;
    }
}


