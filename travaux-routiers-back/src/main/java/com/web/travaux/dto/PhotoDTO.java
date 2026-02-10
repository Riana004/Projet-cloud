package com.web.travaux.dto;

import lombok.Builder;
import lombok.Data;

import java.sql.Timestamp;

@Data
@Builder
public class PhotoDTO {

    private Long id;
    private String url;
    private boolean isDirty;
    private Timestamp updatedAt;
}
