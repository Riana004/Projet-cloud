import { ref } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface Photo {
  id?: string;
  signalementId: string;
  url: string;
  base64?: string;
  timestamp?: number;
}

/**
 * Composable pour gérer les photos des signalements
 */
export function useSignalementPhotos() {
  // We now upload images to Cloudinary (unsigned preset). Firebase Storage removed.
  const photos = ref<Photo[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string>('');

  /**
   * Capture une photo avec la caméra
   */
  const capturePhoto = async (): Promise<Photo | null> => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (!image.base64String) {
        throw new Error('Impossible de capturer la photo');
      }

      const photo: Photo = {
        signalementId: '',
        url: `data:image/jpeg;base64,${image.base64String}`,
        base64: image.base64String,
        timestamp: Date.now(),
      };

      return photo;
    } catch (err: any) {
      error.value = `Erreur capture photo: ${err.message}`;
      console.error(error.value);
      return null;
    }
  };

  /**
   * Sélectionne une photo depuis la galerie
   */
  const selectPhotoFromGallery = async (): Promise<Photo | null> => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (!image.base64String) {
        throw new Error('Impossible de sélectionner la photo');
      }

      const photo: Photo = {
        signalementId: '',
        url: `data:image/jpeg;base64,${image.base64String}`,
        base64: image.base64String,
        timestamp: Date.now(),
      };

      return photo;
    } catch (err: any) {
      error.value = `Erreur sélection photo: ${err.message}`;
      console.error(error.value);
      return null;
    }
  };

  /**
   * Ajoute une photo temporaire à la liste
   */
  const addPhotoLocally = (photo: Photo) => {
    photos.value.push(photo);
  };

  /**
   * Supprime une photo de la liste locale
   */
  const removePhotoLocally = (index: number) => {
    photos.value.splice(index, 1);
  };

  /**
   * Télécharge une photo vers Firebase Storage
   */
  const uploadPhoto = async (signalementId: string, photo: Photo): Promise<string | null> => {
    if (!photo.base64) {
      error.value = 'Photo invalide';
      return null;
    }

    try {
      isLoading.value = true;
      // Convertir base64 en Blob
      const byteCharacters = atob(photo.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Cloudinary upload (unsigned preset)
      const CLOUDINARY_CLOUD_NAME = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME) || 'dfabawwvp'
      const CLOUDINARY_UPLOAD_PRESET = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET) || 'signalement'
      const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`

      const form = new FormData()
      form.append('file', blob, `signalement_${signalementId}_${Date.now()}.jpg`)
      form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      form.append('folder', `signalements/${signalementId}`)

      const res = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: form })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} ${text}`)
      }

      const data = await res.json()
      const downloadURL = data.secure_url || data.url
      if (!downloadURL) throw new Error('Cloudinary did not return a URL')

      return downloadURL;
    } catch (err: any) {
      error.value = `Erreur téléchargement photo: ${err.message}`;
      console.error(error.value);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Télécharge plusieurs photos
   */
  const uploadMultiplePhotos = async (signalementId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const photo of photos.value) {
      const url = await uploadPhoto(signalementId, photo);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    return uploadedUrls;
  };

  /**
   * Supprime une photo de Firebase Storage
   */
  const deletePhotoFromStorage = async (photoUrl: string): Promise<boolean> => {
    // Deleting files from Cloudinary requires server-side credentials.
    // We cannot safely delete an uploaded image from the client using unsigned uploads.
    console.warn('Client-side deletion not supported for Cloudinary unsigned uploads.');
    error.value = 'Suppression non supportée côté client (voir le manager pour supprimer les images).';
    return false;
  };

  /**
   * Réinitialise la liste des photos
   */
  const resetPhotos = () => {
    photos.value = [];
    error.value = '';
  };

  return {
    photos,
    isLoading,
    error,
    capturePhoto,
    selectPhotoFromGallery,
    addPhotoLocally,
    removePhotoLocally,
    uploadPhoto,
    uploadMultiplePhotos,
    deletePhotoFromStorage,
    resetPhotos,
  };
}
