/**
 * API client pour le serveur Firebase Admin Backend
 * Gère l'authentification et le blocage d'utilisateurs
 */

import { API_CONFIG } from '@/config'

const BACKEND_URL = API_CONFIG.FIREBASE_ADMIN_URL

export interface UserStatus {
  email: string;
  attempts: number;
  disabled: boolean;
  exists?: boolean;
  lastAttempt?: any;
  blockedAt?: any;
}

export interface RegisterFailedLoginResponse {
  email: string;
  attempts: number;
  disabled: boolean;
  message: string;
}

export interface UpdateUserStatusResponse {
  success: boolean;
  email: string;
  uid?: string;
  disabled: boolean;
  synced: boolean;
  message: string;
}

/**
 * Vérifier le statut d'un utilisateur
 */
export async function checkUserStatus(email: string): Promise<UserStatus> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/check-status?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la vérification du statut');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur checkUserStatus:', error);
    throw error;
  }
}

/**
 * Enregistrer une tentative de connexion échouée
 */
export async function registerFailedLogin(email: string): Promise<RegisterFailedLoginResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register-failed-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement de la tentative');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur registerFailedLogin:', error);
    throw error;
  }
}

/**
 * Réinitialiser les tentatives de connexion
 */
export async function resetLoginAttempts(email: string): Promise<{ success: boolean; email: string; message: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/reset-attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la réinitialisation');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur resetLoginAttempts:', error);
    throw error;
  }
}

/**
 * Bloquer ou débloquer un utilisateur
 */
export async function updateUserStatus(email: string, disable: boolean): Promise<UpdateUserStatusResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/update-user-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, disable })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du statut');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur updateUserStatus:', error);
    throw error;
  }
}
