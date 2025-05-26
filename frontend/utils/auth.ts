import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${apiUrl}token/refresh`, {
      refresh: refreshToken
    });

    if (response.data.access) {
      localStorage.setItem('accessToken', response.data.access);
      return response.data.access;
    }
    throw new Error('Failed to refresh token');
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Clear tokens on refresh failure
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw error;
  }
};

export const getValidAccessToken = async () => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    // Try to use the current access token
    const response = await axios.post(`${apiUrl}token/verify`, {
      token: accessToken
    });
    console.log("Response from token verificaiton: ", response);
    return accessToken;
  } catch (error) {
    // If the token is invalid/expired, try to refresh it
    console.log("Error: ", error);
    return await refreshAccessToken();

  }


}; 