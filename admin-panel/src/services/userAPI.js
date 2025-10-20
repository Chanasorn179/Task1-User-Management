// services/userAPI.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const handleAPIError = (error) => {
  if (error.message === 'Failed to fetch') {
    throw new Error('Network error. Please check your internet connection.');
  }
  throw error;
};

export const userAPI = {
  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) { handleAPIError(error); }
  },

  getUserById: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) { handleAPIError(error); }
  },

  createUser: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create user');
      }
      const data = await response.json();
      return data.data;
    } catch (error) { handleAPIError(error); }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update user');
      }
      const data = await response.json();
      return data.data;
    } catch (error) { handleAPIError(error); }
  },

  deleteUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete user');
      }
      return { success: true };
    } catch (error) { handleAPIError(error); }
  }
};