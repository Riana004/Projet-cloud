package com.authentification.authentification.service;

import com.authentification.authentification.entity.User;

public interface AuthStrategy {
    boolean authenticate(String email, String password);
    void register(User user);
}