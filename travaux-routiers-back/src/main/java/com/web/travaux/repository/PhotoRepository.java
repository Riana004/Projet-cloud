package com.web.travaux.repository;

import com.web.travaux.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoRepository extends JpaRepository<Photo, Long> {

    List<Photo> findBySignalementId(Long signalementId);

}
