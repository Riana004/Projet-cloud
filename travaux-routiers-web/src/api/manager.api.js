import axios from "axios";

const MANAGER_API = "http://localhost:8086/api/manager/reports";
const AUTH_API = "http://localhost:8080/api/auth";

export const updateReport = (id, data) =>
  axios.put(`${MANAGER_API}/${id}`, data);

export const deleteReport = (id) =>
  axios.delete(`${MANAGER_API}/${id}`);

export const syncFirebase = () =>
  axios.post(`${MANAGER_API}/sync`);

export const syncLocal = () =>
  axios.post(`${MANAGER_API}/sync2`);

export const fetchBlockedUsers = () =>
  axios.get(`${AUTH_API}/blocked`);

export const unlockUser = (id) =>
  axios.patch(`${AUTH_API}/unlock/${id}`);

