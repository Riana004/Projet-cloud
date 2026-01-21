package com.web.travaux.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.web.travaux.dto.ReportDTO;
import com.web.travaux.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*") // React
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    public List<ReportDTO> getAllReports() {
        return reportService.getAllReports();
    }
}
