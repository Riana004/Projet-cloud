import axios from "axios";

const SIGNAL_API = "http://localhost:8086/api/signalements"; // 👈 nouveau

// ==================== PHOTOS ====================

// récupérer les photos d’un signalement
export const fetchReportPhotos = (signalementId) =>
  axios.get(`${SIGNAL_API}/${signalementId}/photo`);


// upload photo (si tu as un endpoint POST)
export const uploadReportPhoto = (signalementId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(`${SIGNAL_API}/${signalementId}/photos`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


// supprimer une photo
export const deletePhoto = (photoId) =>
  axios.delete(`${SIGNAL_API}/photos/${photoId}`);
