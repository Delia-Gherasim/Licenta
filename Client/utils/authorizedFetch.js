import AuthObserver from "./AuthObserver";

const authorizedFetch = async (url, options = {}) => {
  const token = await AuthObserver.getToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  const finalOptions = {
    ...options,
    headers,
  };

  return fetch(url, finalOptions);
};

export default authorizedFetch;
