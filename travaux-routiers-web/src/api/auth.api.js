import axios from "axios";

const AUTH_API_URL = "http://localhost:8080/api/auth";


export const loginFirebaseApi = (data) => {
  return axios.post(`${AUTH_API_URL}/login-firebase`, data);
};

export const loginRoleApi = (data) => {
  return axios.post(`${AUTH_API_URL}/login-role`, data);
};


export const registerApi = (data) => {
  return axios.post(`${AUTH_API_URL}/register`, data);
};
