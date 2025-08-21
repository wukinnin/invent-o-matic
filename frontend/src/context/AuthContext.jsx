import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        user: action.payload.user, // Assuming the backend sends user info
        loading: false
      };
    case 'LOGOUT':
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false
      };
    case 'USER_LOADED':
        return {
            ...state,
            isAuthenticated: true,
            user: action.payload,
            loading: false
        };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  // Function to load user data if token exists
  const loadUser = async () => {
    if (localStorage.token) {
        // In a real app, you would have an endpoint to get user data by token
        // For now, we'll decode it. A better approach is a /api/auth/me endpoint.
        // This is a simplified version for now.
        dispatch({ type: 'USER_LOADED', payload: { role: 'Staff' } }); // Placeholder
    } else {
        dispatch({ type: 'AUTH_ERROR' });
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Login User
  const login = async formData => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR' });
      console.error(err.response ? err.response.data : err.message);
      alert('Login Failed: ' + (err.response ? err.response.data.message : err.message));
    }
  };

  // Logout
  const logout = () => dispatch({ type: 'LOGOUT' });

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
