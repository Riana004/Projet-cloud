import axios from "axios";

const AUTH_API_URL_FIREBASE = "http://localhost:8080/api/auth";
const AUTH_API_URL_LOCAL_ROLE = "http://localhost:8085/api/auth";

// Utiliser la bonne constante
export const loginFirebaseApi = (data) => {
  return axios.post(`${AUTH_API_URL_FIREBASE}/login-firebase`, data);
};

export const loginRoleApi = (data) => {
  return axios.post(`${AUTH_API_URL_LOCAL_ROLE}/login-role`, data);
};

export const registerApi = (data) => {
  return axios.post(`${AUTH_API_URL_FIREBASE}/register`, data);
};
