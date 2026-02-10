package com.web.travaux.service.impl;

import com.web.travaux.entity.Photo;
import com.web.travaux.repository.PhotoRepository;
import com.web.travaux.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotoServiceImpl implements PhotoService {

    private final PhotoRepository photoRepository;

    @Override
    public List<Photo> getPhotosBySignalement(Long signalementId) {
        return photoRepository.findBySignalementId(signalementId);
    }
}
