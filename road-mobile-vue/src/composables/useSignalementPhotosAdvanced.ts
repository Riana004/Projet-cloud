import { ref } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
  const storage = getStorage();
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
      const timestamp = Date.now();
      const fileName = `signalements/${signalementId}/${timestamp}.jpg`;
      const fileRef = storageRef(storage, fileName);

      // Convertir base64 en Blob
      const byteCharacters = atob(photo.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Télécharger le fichier
      await uploadBytes(fileRef, blob);

      // Récupérer l'URL de téléchargement
      const downloadURL = await getDownloadURL(fileRef);

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
    try {
      isLoading.value = true;
      const fileRef = storageRef(storage, photoUrl);
      await deleteObject(fileRef);
      return true;
    } catch (err: any) {
      error.value = `Erreur suppression photo: ${err.message}`;
      console.error(error.value);
      return false;
    } finally {
      isLoading.value = false;
    }
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
