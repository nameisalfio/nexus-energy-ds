package com.energy.energy_server.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ErrorResponse(
        String error,
        String code,
        List<ValidationDetail> details,
        @JsonProperty("message") String message
) {
    public ErrorResponse(String error, String code, List<ValidationDetail> details) {
        this(error, code, details, error);
    }

    public record ValidationDetail(String field, String message) {}
}
