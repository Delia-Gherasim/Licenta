const subscribers = {};

export const subscribe = (eventType, callback) => {
  if (!subscribers[eventType]) subscribers[eventType] = new Set();
  subscribers[eventType].add(callback);
  return () => subscribers[eventType].delete(callback);
};

export const emit = (eventType, payload) => {
  if (subscribers[eventType]) {
    subscribers[eventType].forEach((callback) => callback(payload));
  }
};
