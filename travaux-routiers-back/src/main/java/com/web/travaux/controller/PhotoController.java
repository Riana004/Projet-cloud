package com.web.travaux.controller;

import com.web.travaux.dto.PhotoDTO;
import com.web.travaux.entity.Photo;
import com.web.travaux.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @GetMapping("/{id}/photos")
    public List<PhotoDTO> getPhotosBySignalement(@PathVariable Long id) {

        List<Photo> photos = photoService.getPhotosBySignalement(id);

        return photos.stream()
                .map(photo -> PhotoDTO.builder()
                        .id(photo.getId())
                        .url(photo.getUrl())
                        .isDirty(photo.isDirty())
                        .updatedAt(photo.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
