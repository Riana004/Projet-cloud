package com.web.travaux.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.web.travaux.service.StatistiqueService;
import org.springframework.beans.factory.annotation.Autowired;
@RestController
@RequestMapping("/api/stats")
public class StatistiqueController {

    @Autowired
    private final StatistiqueService service;

    public StatistiqueController(StatistiqueService service) {
        this.service = service;
    }
    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return service.statsCompletes();
    }
}
