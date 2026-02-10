package com.authentification.authentification.security;

import com.authentification.authentification.service.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class SessionFilter extends OncePerRequestFilter {

    private final SessionService sessionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Récupérer le token du header Authorization
        String token = request.getHeader("Authorization");

        //ssio2. Si le token est présent et valide en base
        if (token != null && sessionService.isSessionValid(token)) {
            // On informe Spring Security que l'utilisateur est authentifié
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    token, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        // 3. Continuer la chaîne de filtres
        filterChain.doFilter(request, response);
    }
}