// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { PredictionMarket } from "../PredictionMarket.sol";

/// @title IPredictionFactory - Interface for prediction market factory
/// @author PredictX
interface IPredictionFactory {
    /// @notice Event emitted when a new prediction is created
    event PredictionCreated(
        uint256 indexed predictionId,
        address indexed creator,
        address predictionAddress,
        uint256 endTime,
        uint256 targetPrice
    );


    function createPrediction(
        string memory _pairName,
        PredictionMarket.Direction _direction,
        uint256 _targetPrice,
        uint256 _endTime,
        string memory _metadataURI,
        uint256 _initialLiquidity
    ) external returns (address);

    /// @notice Withdraw accumulated protocol fees (ERC20 or ETH) to the owner
    /// @param token Address of ERC20 token to withdraw, or address(0) for ETH
    function withdrawProtocolFees(address token) external;

    /// @notice Returns list of prediction ids created by user
    /// @param _user Address of the user
    /// @return Array of prediction IDs created by the user
    function getUserPredictions(address _user) external view returns (uint256[] memory);

    /// @notice Returns outcome of a specific prediction
    /// @param _predictionId ID of the prediction
    /// @return Outcome of the prediction (Yes, No, or Undetermined)
    function getPredictionOutcome(uint256 _predictionId) external view returns (PredictionMarket.Outcome);

    /// @notice Get the address of a prediction by its ID
    /// @param _predictionId ID of the prediction
    /// @return Address of the prediction contract
    function predictions(uint256 _predictionId) external view returns (address);

    /// @notice Get the total number of predictions created
    /// @return Total count of predictions
    function predictionCount() external view returns (uint256);

}
