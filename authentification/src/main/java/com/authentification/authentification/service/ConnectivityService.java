package com.authentification.authentification.service;

import org.springframework.stereotype.Service;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;

@Service
public class ConnectivityService {

    /**
     * Vérifie si internet est disponible en tentant de joindre le port 53 (DNS) 
     * de Google. C'est plus rapide et fiable qu'un ping.
     */
    public boolean isOnline() {
        try (Socket socket = new Socket()) {
            int timeoutMs = 2000; // 2 secondes max pour répondre
            socket.connect(new InetSocketAddress("8.8.8.8", 53), timeoutMs);
            return true;
        } catch (IOException e) {
            // Si une exception est levée, on considère qu'on est offline
            return false;
        }
    }
}