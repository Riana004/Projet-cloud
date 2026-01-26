package com.web.travaux.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.google.firebase.database.FirebaseDatabase;
import com.web.travaux.dto.ReportDTO;

@Service
public class FirebaseSyncService {

    public void syncReports(List<ReportDTO> reports) {
        reports.forEach(r ->
            FirebaseDatabase.getInstance()
                .getReference("reports")
                .child(r.getId().toString())
                .setValueAsync(r)
        );
    }
}
