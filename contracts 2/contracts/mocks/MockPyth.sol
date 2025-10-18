// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/// @title MockPyth - Minimal mock to satisfy Prediction needs in tests
/// @dev Not a full IPyth implementation; only functions used in PredictionFactory/Prediction
contract MockPyth {

    mapping(bytes32 => PythStructs.Price) public priceById;

    function setPrice(bytes32 id, int64 price, int32 expo) external {
        // publishTime is not used by our consumer beyond bounds; set to now
        priceById[id] = PythStructs.Price({ price: price, conf: 0, expo: expo, publishTime:0 });
    }

    function getUpdateFee(bytes[] calldata) external pure returns (uint256) {
        return 0; // free in mock
    }

    function updatePriceFeeds(bytes[] calldata) external payable {}

    function parsePriceFeedUpdates(
        bytes[] calldata,
        bytes32[] calldata ids,
        uint64,
        uint64
    ) external view returns (PythStructs.PriceFeed[] memory feeds) {
        feeds = new PythStructs.PriceFeed[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            PythStructs.Price memory p = priceById[ids[i]];
            feeds[i] = PythStructs.PriceFeed({ id: ids[i], price: p, emaPrice: p });
        }
    }

    function getPriceNoOlderThan(bytes32 id, uint256) external view returns (PythStructs.Price memory) {
        return priceById[id];
    }
}



