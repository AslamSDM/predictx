// A simple in-memory cache for chat messages

const cache = new Map();
const MAX_MESSAGES = 100;

/**
 * Adds a message to the cache for a specific room.
 * Ensures that the cache for any given room does not exceed MAX_MESSAGES.
 *
 * @param {string} roomId The ID of the prediction market room.
 * @param {object} message The message object to store.
 */
function addMessage(roomId, message) {
    // If the room doesn't exist in the cache, create it.
    if (!cache.has(roomId)) {
        cache.set(roomId, []);
    }

    const roomMessages = cache.get(roomId);
    roomMessages.push(message);

    // If the array has grown beyond the max size, remove the oldest message.
    if (roomMessages.length > MAX_MESSAGES) {
        roomMessages.shift(); // .shift() is an O(n) operation, but fine for an array of 100 items.
    }
}

/**
 * Retrieves the message history for a given room from the cache.
 *
 * @param {string} roomId The ID of the prediction market room.
 * @returns {Array} An array of message objects.
 */
function getMessageHistory(roomId) {
    return cache.get(roomId) || [];
}

module.exports = {
    addMessage,
    getMessageHistory,
};
