package com.web.travaux.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.Timestamp;
import com.web.travaux.dto.PhotoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class FirestorePhotoService {

    @Autowired
    private Firestore firestore;

  public List<PhotoDTO> getPhotosBySignalementId(String firebaseId) {
    List<PhotoDTO> photos = new ArrayList<>();

    try {
        var query = firestore.collection("photos")
            .whereEqualTo("id_signalement", firebaseId) // 🔥 matcher avec String
            .get();

        var documents = query.get().getDocuments();

        for (var document : documents) {
            com.google.cloud.Timestamp ts = document.getTimestamp("date_ajout");

            PhotoDTO photo = PhotoDTO.builder()
                .id(document.getId()) // 🔥 toujours utiliser document.getId()
                .url(document.getString("url"))
                .signalementId(firebaseId) // mettre le Firebase ID
                .updatedAt(ts)
                .build();

            photos.add(photo);
        }

    } catch (InterruptedException | ExecutionException e) {
        throw new RuntimeException("Erreur lors de la récupération des photos", e);
    }

    return photos;
}

    public PhotoDTO getPhotoById(String photoId) {
        try {
            var document = firestore.collection("photos")
                .document(photoId)
                .get()
                .get();

            if (!document.exists()) return null;

            Timestamp ts = document.getTimestamp("date_ajout");

            return PhotoDTO.builder()
                .id(document.getId())
                .url(document.getString("url"))
                .signalementId(document.getString("id_signalement"))
                .updatedAt(ts)
                .build();

        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Erreur lors de la récupération de la photo", e);
        }
    }
}
