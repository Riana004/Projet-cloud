package com.web.travaux.dto;

public class SignalementSummaryResponse {
    private int totalPoints;
    private double totalSurface;
    private double totalBudget;
    private int progressPercent;

    public SignalementSummaryResponse() {
    }

    public SignalementSummaryResponse(int totalPoints, double totalSurface, double totalBudget, int progressPercent) {
        this.totalPoints = totalPoints;
        this.totalSurface = totalSurface;
        this.totalBudget = totalBudget;
        this.progressPercent = progressPercent;
    }

    public int getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(int totalPoints) {
        this.totalPoints = totalPoints;
    }

    public double getTotalSurface() {
        return totalSurface;
    }

    public void setTotalSurface(double totalSurface) {
        this.totalSurface = totalSurface;
    }

    public double getTotalBudget() {
        return totalBudget;
    }

    public void setTotalBudget(double totalBudget) {
        this.totalBudget = totalBudget;
    }

    public int getProgressPercent() {
        return progressPercent;
    }

    public void setProgressPercent(int progressPercent) {
        this.progressPercent = progressPercent;
    }
}
