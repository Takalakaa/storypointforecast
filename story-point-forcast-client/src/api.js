import axios from "axios";

const API_URL = "http://localhost:5000";

// Get user profile
export const getUser = async (userId) => {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
};

// Update user profile
export const updateUser = async (userId, userData) => {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData);
    return response.data;
};

// Get developers in a project (Manager View)
export const getProjectDevelopers = async (projectId) => {
    const response = await axios.get(`${API_URL}/projects/${projectId}/developers`);
    return response.data;
};
