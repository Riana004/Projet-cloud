import axios from "axios";

const AUTH_API_URL = "http://localhost:8080/api/auth";

export const loginApi = (data) => {
  return axios.post(`${AUTH_API_URL}/login`, data); // data = { email, password }
};

export const registerApi = (data) => {
  return axios.post(`${AUTH_API_URL}/register`, data);
};
