package com.web.travaux.dto;

import java.time.LocalDateTime;

public class SignalementResponse {
    private Long id;
    private String description;
    private LocalDateTime date;
    private String status;
    private double surfaceM2;
    private double budget;
    private String entreprise;
    private double lat;
    private double lng;

    public SignalementResponse() {
    }

    public SignalementResponse(Long id, String description, LocalDateTime date, String status,
                               double surfaceM2, double budget, String entreprise, double lat, double lng) {
        this.id = id;
        this.description = description;
        this.date = date;
        this.status = status;
        this.surfaceM2 = surfaceM2;
        this.budget = budget;
        this.entreprise = entreprise;
        this.lat = lat;
        this.lng = lng;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getSurfaceM2() {
        return surfaceM2;
    }

    public void setSurfaceM2(double surfaceM2) {
        this.surfaceM2 = surfaceM2;
    }

    public double getBudget() {
        return budget;
    }

    public void setBudget(double budget) {
        this.budget = budget;
    }

    public String getEntreprise() {
        return entreprise;
    }

    public void setEntreprise(String entreprise) {
        this.entreprise = entreprise;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLng() {
        return lng;
    }

    public void setLng(double lng) {
        this.lng = lng;
    }
}
