import axios from "axios";

const AUTH_API_URL_FIREBASE = "http://localhost:8080/api/auth";
const AUTH_API_URL_LOCAL_ROLE = "http://localhost:8085/api/auth";

// 🔐 Firebase + sécurité locale
export const registerFirebaseApi = (data) => {
  return axios.post(
    "http://localhost:8080/api/auth/register",
    {
      email: data.email,
      password: data.password,
    },
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};


// 👤 Base locale avec rôle (Postgres)
export const registerRoleApi = (data) => {
  return axios.post(
    `${AUTH_API_URL_LOCAL_ROLE}/register`,
    {
      email: data.email,
      password: data.password,
    },
    {
      headers: { "Content-Type": "application/json" }
    }
  );
};

export const loginFirebaseApi = ({ email, password }) => {
  return axios.post(
    `${AUTH_API_URL_FIREBASE}/login-firebase`,
    null, // ⬅️ PAS DE BODY
    {
      params: { email, password }, // ⬅️ ICI
      withCredentials: true,
    }
  );
};


// Login local avec rôle
export const loginRoleApi = (data) => {
  return axios.post(
    `${AUTH_API_URL_LOCAL_ROLE}/login-role`,
    data,
    {
      headers: { "Content-Type": "application/json" }
    }
  );
};


