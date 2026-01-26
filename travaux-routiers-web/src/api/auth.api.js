import axios from "axios";

const AUTH_API_URL_FIREBASE = "http://localhost:8080/api/auth";
const AUTH_API_URL_LOCAL_ROLE = "http://localhost:8085/api/auth";

// 🔐 Firebase + sécurité locale
export const registerFirebaseApi = (data) => {
  return axios.post(`${AUTH_API_URL_FIREBASE}/register`, {
    email: data.email,
    password: data.password
  });
};

// 👤 Base locale avec rôle
export const registerRoleApi = (data) => {
  return axios.post(`${AUTH_API_URL_LOCAL_ROLE}/register`, {
    email: data.email,
    password: data.password
  });
};

// Login
export const loginFirebaseApi = (data) => {
  return axios.post(`${AUTH_API_URL_FIREBASE}/login-firebase`, data);
};

export const loginRoleApi = (data) => {
  return axios.post(`${AUTH_API_URL_LOCAL_ROLE}/login-role`, data);
};
