import axios from 'axios';

const API_URL = '/api/users/';

// Register user
const register = async (userData) => {
    const response = await axios.post(API_URL, userData);

    if(response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
}

// Login user
const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);

    if(response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
}

// Logout user
const logout = async () => {
    localStorage.removeItem('user');
};

// Update user profile
const updateProfile = async (userData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const response = await axios.put(API_URL + 'profile', userData, config);

    if(response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
};

const authService = {
    register,
    logout,
    login,
    updateProfile
};

export default authService;