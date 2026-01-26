package com.authentification.authentification.dto;

public class UserDTO {
    private Long id;
    private String email;
    private int failedAttempts;
    public UserDTO(Long id2, String email2, int failedAttempts2, boolean blocked2) {
        this.id = id2;
        this.email = email2;
        this.failedAttempts = failedAttempts2;
        this.blocked = blocked2;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(int failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    private boolean blocked;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    
    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }
}
