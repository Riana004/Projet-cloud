import axios from "axios";

/*
  API backend
  Exemple : http://localhost:8081/api/signalements
*/
const MAP_API_URL = "http://localhost:8085/api/reports";
<<<<<<< HEAD
=======

>>>>>>> 31cc15c9a79236d8b32735cc960b5a8b3e3642a7

export const fetchReports = () => {
  return axios.get(MAP_API_URL);
};
