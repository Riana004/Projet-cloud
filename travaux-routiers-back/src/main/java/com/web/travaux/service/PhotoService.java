package com.web.travaux.service;

import com.web.travaux.entity.Photo;

import java.util.List;

public interface PhotoService {

    List<Photo> getPhotosBySignalement(Long signalementId);

}
