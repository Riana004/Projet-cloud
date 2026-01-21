import axios from "axios";

/*
  API de ton collaborateur
  Exemple : http://localhost:8081/api/reports
*/
const MAP_API_URL = "http://localhost:8080/api/reports";

export const fetchReports = () => {
  return axios.get(MAP_API_URL);
};
