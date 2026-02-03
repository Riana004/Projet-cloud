import axios from "axios";

/*
  API backend
  Exemple : http://localhost:8081/api/signalements
*/
const MAP_API_URL = "http://localhost:8081/api/reports";

export const fetchReports = () => {
  return axios.get(MAP_API_URL);
};
