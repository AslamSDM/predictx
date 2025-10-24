interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  room: string;
}

const cache = new Map<string, Message[]>();
const MAX_MESSAGES = 100;

export function addMessage(roomId: string, message: Message) {
  if (!cache.has(roomId)) {
    cache.set(roomId, []);
  }

  const roomMessages = cache.get(roomId)!;
  roomMessages.push(message);

  if (roomMessages.length > MAX_MESSAGES) {
    roomMessages.shift();
  }
}

export function getMessageHistory(roomId: string): Message[] {
  return cache.get(roomId) || [];
}
