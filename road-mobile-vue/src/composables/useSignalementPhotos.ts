import { ref, computed } from 'vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export interface Photo {
  id: string
  blob: Blob
  url?: string
  uploadedUrl?: string
  isUploaded: boolean
}

export function useSignalementPhotos() {
  const photos = ref<Photo[]>([])
  const isUploading = ref(false)
  const uploadError = ref<string>('')
  const uploadProgress = ref<Record<string, number>>({})

  const photosCount = computed(() => photos.value.length)
  const allPhotosUploaded = computed(() => photos.value.every((p) => p.isUploaded))

  /**
   * Capturer une photo avec la caméra
   */
  const capturePhoto = async (): Promise<Photo | null> => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        direction: undefined,
      })

      if (!image.webPath) {
        throw new Error('Impossible de capturer la photo')
      }

      // Convertir l'URI en Blob
      const response = await fetch(image.webPath)
      const blob = await response.blob()

      const photo: Photo = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        blob,
        url: image.webPath,
        isUploaded: false,
      }

      photos.value.push(photo)
      return photo
    } catch (error: any) {
      console.error('Erreur capture photo:', error)
      uploadError.value = 'Impossible de capturer la photo'
      return null
    }
  }

  /**
   * Sélectionner une photo depuis la galerie
   */
  const selectPhotoFromGallery = async (): Promise<Photo | null> => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      })

      if (!image.webPath) {
        throw new Error('Impossible de sélectionner la photo')
      }

      // Convertir l'URI en Blob
      const response = await fetch(image.webPath)
      const blob = await response.blob()

      const photo: Photo = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        blob,
        url: image.webPath,
        isUploaded: false,
      }

      photos.value.push(photo)
      return photo
    } catch (error: any) {
      console.error('Erreur sélection photo:', error)
      uploadError.value = 'Impossible de sélectionner la photo'
      return null
    }
  }

  /**
   * Uploader une photo vers Firebase Storage
   */
  const uploadPhoto = async (photo: Photo, signalementId: string): Promise<string | null> => {
    try {
      uploadError.value = ''
      const storage = getStorage()

      // Chemin: /signalements/{signalementId}/{photoId}
      const photoRef = storageRef(storage, `signalements/${signalementId}/${photo.id}.jpg`)

      // Uploader le fichier
      const snapshot = await uploadBytes(photoRef, photo.blob)

      // Récupérer l'URL de téléchargement
      const downloadUrl = await getDownloadURL(snapshot.ref)

      // Mettre à jour le statut de la photo
      const photoIndex = photos.value.findIndex((p) => p.id === photo.id)
      if (photoIndex !== -1) {
        photos.value[photoIndex].uploadedUrl = downloadUrl
        photos.value[photoIndex].isUploaded = true
      }

      return downloadUrl
    } catch (error: any) {
      console.error('Erreur upload photo:', error)
      uploadError.value = `Erreur lors de l'upload: ${error.message}`
      return null
    }
  }

  /**
   * Uploader toutes les photos
   */
  const uploadAllPhotos = async (signalementId: string): Promise<string[]> => {
    if (photos.value.length === 0) return []

    isUploading.value = true
    uploadError.value = ''

    const uploadedUrls: string[] = []

    try {
      for (const photo of photos.value) {
        if (!photo.isUploaded) {
          uploadProgress.value[photo.id] = 0
          const url = await uploadPhoto(photo, signalementId)
          if (!url) {
            throw new Error('Upload photo échoué. Vérifiez Firebase Storage et les règles.')
          }
          uploadedUrls.push(url)
          uploadProgress.value[photo.id] = 100
        } else {
          uploadedUrls.push(photo.uploadedUrl!)
        }
      }

      return uploadedUrls
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Supprimer une photo
   */
  const removePhoto = (photoId: string) => {
    photos.value = photos.value.filter((p) => p.id !== photoId)
  }

  /**
   * Réinitialiser les photos
   */
  const clearPhotos = () => {
    photos.value = []
    uploadProgress.value = {}
    uploadError.value = ''
  }

  /**
   * Obtenir les URL de toutes les photos uploadées
   */
  const getUploadedPhotoUrls = (): string[] => {
    return photos.value.filter((p) => p.isUploaded && p.uploadedUrl).map((p) => p.uploadedUrl!)
  }

  return {
    photos,
    photosCount,
    allPhotosUploaded,
    isUploading,
    uploadError,
    uploadProgress,
    capturePhoto,
    selectPhotoFromGallery,
    uploadPhoto,
    uploadAllPhotos,
    removePhoto,
    clearPhotos,
    getUploadedPhotoUrls,
  }
}
