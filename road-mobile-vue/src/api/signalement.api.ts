import axios from 'axios'
import { API_CONFIG } from '@/config'

// Instance axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: API_CONFIG.API_BASE_URL,
  timeout: API_CONFIG.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Non authentifié - redirection vers login')
    }
    return Promise.reject(error)
  }
)

// API pour les signalements
export const signalementApi = {
  // Récupérer tous les signalements
  getAllSignalements: () => {
    return apiClient.get(API_CONFIG.SIGNALEMENTS_URL)
  },

  // Récupérer un signalement par ID
  getSignalementById: (id: number) => {
    return apiClient.get(`${API_CONFIG.SIGNALEMENTS_URL}/${id}`)
  },

  // Créer un nouveau signalement
  createSignalement: (data: any) => {
    return apiClient.post(API_CONFIG.SIGNALEMENTS_URL, data)
  },

  // Mettre à jour un signalement
  updateSignalement: (id: number, data: any) => {
    return apiClient.put(`${API_CONFIG.SIGNALEMENTS_URL}/${id}`, data)
  },

  // Supprimer un signalement
  deleteSignalement: (id: number) => {
    return apiClient.delete(`${API_CONFIG.SIGNALEMENTS_URL}/${id}`)
  },
}

// API pour les rapports
export const reportApi = {
  // Récupérer tous les rapports
  getAllReports: () => {
    return apiClient.get(API_CONFIG.REPORTS_URL)
  },
}

// API pour l'authentification
export const authApi = {
  // Login Firebase
  loginFirebase: (email: string, password: string) => {
    return apiClient.post(`${API_CONFIG.AUTH_URL}/login-firebase`, null, {
      params: { email, password },
    })
  },

  // Login avec rôle
  loginRole: (data: any) => {
    return apiClient.post(`${API_CONFIG.AUTH_URL}/login-role`, data)
  },

  // Register Firebase
  registerFirebase: (data: any) => {
    return apiClient.post(`${API_CONFIG.AUTH_URL}/register`, data)
  },

  // Register avec rôle
  registerRole: (data: any) => {
    return apiClient.post(`${API_CONFIG.AUTH_URL}/register`, data)
  },
}

export default apiClient
