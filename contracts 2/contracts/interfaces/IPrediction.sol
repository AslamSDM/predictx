// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPrediction - Interface for a single prediction market instance
/// @author PredictX
interface IPrediction {
    /// @notice Prediction status lifecycle
    enum Status { Open, Resolved}

    /// @notice Final outcome of the prediction
    enum Outcome { Undetermined, Yes, No }

    /// @notice Direction of the prediction target
    enum Direction { Up, Down }

    /// @notice Emitted when a user votes on an outcome
    event Voted(address indexed voter, bool supportsOutcome, uint256 amount);

    event VotesTransferred(address indexed voter, Outcome supportsOutcome, uint256 amount);
    event VotesIncreased(address indexed voter, Outcome supportsOutcome, uint256 amount);

    /// @notice Emitted when the prediction is resolved
    event PredictionResolved(Outcome finalOutcome, uint256 finalPrice);

    /// @notice Emitted when a user claims winnings
    event WinningsClaimed(address indexed user, uint256 amount);

    function creator() external view returns (address);
    function factory() external view returns (address);
    function feePercentage() external view returns (uint256);
    function stakeToken() external view returns (address);
    function direction() external view returns (Direction);
    function pairName() external view returns (string memory);
    function pythPriceFeedId() external view returns (bytes32);
    function targetPrice() external view returns (uint256);
    function startTime() external view returns (uint256);
    function endTime() external view returns (uint256);
    function metadataURI() external view returns (string memory);
    function status() external view returns (Status);
    function outcome() external view returns (Outcome);
    function yesPool() external view returns (uint256);
    function noPool() external view returns (uint256);
    function yesVotes(address user) external view returns (uint256);
    function noVotes(address user) external view returns (uint256);
    function hasClaimed(address user) external view returns (bool);

    function vote(bool _supportsOutcome, uint256 amount) external;
    function resolvePrediction(bytes[] calldata _highPriceUpdateData, bytes[] calldata _lowPriceUpdateData,bytes[] calldata price_update) external payable;
    function claimWinnings() external;
}


