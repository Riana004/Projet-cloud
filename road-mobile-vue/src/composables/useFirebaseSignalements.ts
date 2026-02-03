import { ref } from 'vue';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../firebase/firebase';

const db = getFirestore();

export function useFirebaseSignalements() {
  const signalements = ref<any[]>([]);
  const mySignalements = ref<any[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string>('');

  const fetchAllSignalements = async () => {
    isLoading.value = true;
    error.value = '';

    try {
      const querySnapshot = await getDocs(collection(db, 'signalements'));
      signalements.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err: any) {
      error.value = `Erreur lors de la récupération des signalements: ${err.message}`;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchMySignalements = async () => {
    if (!auth.currentUser) {
      error.value = 'Vous devez être connecté';
      return;
    }

    isLoading.value = true;
    error.value = '';

    try {
      const q = query(
        collection(db, 'signalements'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      mySignalements.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err: any) {
      error.value = `Erreur lors de la récupération de vos signalements: ${err.message}`;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    signalements,
    mySignalements,
    isLoading,
    error,
    fetchAllSignalements,
    fetchMySignalements,
  };
}
