package com.web.travaux.dto;

import com.google.cloud.Timestamp;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhotoDTO {

    private String id;
    private String url;
    private String signalementId;
    private boolean isDirty;
    private Timestamp updatedAt;
}
