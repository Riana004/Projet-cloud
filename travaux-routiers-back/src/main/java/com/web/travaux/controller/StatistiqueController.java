package com.web.travaux.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.we.travaux.service.StatistiqueService;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatistiqueController {

    private final StatistiqueService service;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return service.statsCompletes();
    }
}
