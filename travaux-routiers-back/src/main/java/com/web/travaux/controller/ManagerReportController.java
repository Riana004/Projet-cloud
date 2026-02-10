package com.web.travaux.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.travaux.dto.UpdateReportDTO;
import com.web.travaux.service.FirebaseSyncService;
import com.web.travaux.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/manager/reports")
@RequiredArgsConstructor
public class ManagerReportController {

    private final ReportService reportService;
    private final FirebaseSyncService firebaseSyncService;

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateReport(
        @PathVariable Long id,
        @RequestBody UpdateReportDTO dto
    ) {
        reportService.updateReport(id, dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }

    // @PostMapping("/sync")
    // public ResponseEntity<String> syncFirebase() {
    //     firebaseSyncService.syncReports(reportService.getAllReports());
    //     return ResponseEntity.ok("Synchronisation Firebase réussie");
    // }
@PostMapping("/sync")
public ResponseEntity<String> syncFirebase() {
    firebaseSyncService.syncFromFirebaseToPostgres();
    return ResponseEntity.ok("Synchronisation Firebase ⇄ PostgreSQL réussie");
}

@PostMapping("/sync2")
public ResponseEntity<String> syncLocal() {
    firebaseSyncService.syncFromPostgresToFirebase();
    firebaseSyncService.syncUsersToFirebase();
    firebaseSyncService.syncAvancementToFirebase();
    return ResponseEntity.ok("Synchronisation Firebase ⇄ PostgreSQL réussie");
}


}
