let onPostAdded = null;

const subscribers = new Set();

export const subscribeToPostAdded = (callback) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback); 
};

export const emitPostAdded = () => {
  subscribers.forEach((callback) => callback());
};

export const notifyPostAdded = () => {
  if (onPostAdded) onPostAdded();
};
export const subscribeToPostChange = (callback) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback); 
};

export const emitPostChange = () => {
  subscribers.forEach((callback) => callback());
};
