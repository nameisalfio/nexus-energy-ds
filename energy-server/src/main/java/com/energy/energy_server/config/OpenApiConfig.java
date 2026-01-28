package com.energy.energy_server.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.context.annotation.Configuration;

/**
 * Configurazione OpenAPI 3.0 per la documentazione dell'API.
 *
 * <p>Swagger UI disponibile su: <code>/swagger-ui.html</code>
 * <p>OpenAPI JSON disponibile su: <code>/v3/api-docs</code>
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Energy Server API",
                version = "1.0.0",
                description = """
                        API REST per il sistema di monitoraggio energetico distribuito.
                        
                        Funzionalità principali:
                        - Autenticazione JWT
                        - Monitoraggio in tempo reale
                        - Previsioni AI
                        - Gestione utenti e ruoli
                        """,
                contact = @Contact(
                        name = "Energy Team",
                        email = "support@energy.com",
                        url = "https://energy-system.com"
                ),
                license = @License(
                        name = "Proprietary",
                        url = "https://energy-system.com/license"
                )
        ),
        servers = {
                @Server(
                        description = "Local Development",
                        url = "http://localhost:8081"
                ),
                @Server(
                        description = "Production",
                        url = "https://api.energy-system.com"
                )
        },
        security = {
                @SecurityRequirement(name = "bearerAuth")
        },
        tags = {
                @Tag(name = "Authentication", description = "Gestione autenticazione e autorizzazione"),
                @Tag(name = "Energy Monitoring", description = "Endpoint per monitoraggio energetico"),
                @Tag(name = "AI Predictions", description = "Previsioni basate su Machine Learning"),
                @Tag(name = "Analytics", description = "Statistiche e analytics")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = """
                JWT Authentication.
                
                Per ottenere un token:
                1. POST /api/auth/login con credenziali
                2. Copia il token dalla risposta
                3. Click su 'Authorize' e inserisci: Bearer <token>
                """,
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}