// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IPrediction } from "./IPrediction.sol";

/// @title IPredictionFactory - Interface for the prediction factory
/// @author PredictX
interface IPredictionFactory {
    function pythContractAddress() external view returns (address);
    event PredictionCreated(
        uint256 indexed predictionId,
        address indexed creator,
        address predictionAddress,
        uint256 endTime,
        uint256 targetPrice
    );

    function createPrediction(
        string memory _pairName,
        IPrediction.Direction _direction,
        uint256 _targetPrice,
        uint256 _endTime,
        string memory _metadataURI
    ) external returns (address);

    function manualOverride(uint256 _predictionId) external;
    function withdrawProtocolFees(address token) external;
    function getUserPredictions(address _user) external view returns (uint256[] memory);
    function getPredictionOutcome(uint256 _predictionId) external view returns (IPrediction.Outcome);
    function setFeePercentage(uint256 _newFee) external;
}


