package com.energy.energy_server.security;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;

@Service
public class TokenBlacklistService {

    private final Cache<String, Boolean> tokenBlacklist;

    public TokenBlacklistService(@Value("${JWT_EXPIRATION_MS}") long expirationMs) {
        this.tokenBlacklist = CacheBuilder.newBuilder()
                .expireAfterWrite(expirationMs, TimeUnit.MILLISECONDS)
                .maximumSize(10000) 
                .build();
    }

    public void blacklistToken(String token) {
        tokenBlacklist.put(token, true);
    }

    public boolean isBlacklisted(String token) {
        return tokenBlacklist.getIfPresent(token) != null;
    }
}