package com.backend.admin;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.annotation.Configuration;

import java.util.Map;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.assertThat;

class PackagedResourceSafetyTest {
    @Configuration(proxyBeanMethods = false)
    static class ConfigurationOnly { }

    @Test
    void privateResourcesAreAbsentFromRuntimeClasspath() {
        ClassLoader loader = getClass().getClassLoader();
        for (String path : new String[]{"secret/app.key", "secret/key0527.pem",
                "secret/custom.properties", "secret/backup.sql"}) {
            assertThat(loader.getResource(path)).as("private resource %s", path).isNull();
        }
        assertThat(loader.getResource("application.properties")).isNotNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"local", "prod"})
    void profilesLoadWithoutBundledSecretFileAndAcceptExternalSigningKey(String profile) {
        // Load configuration only: no component scanning, DB or external service beans.
        SpringApplication app = new SpringApplication(ConfigurationOnly.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setLogStartupInfo(false);
        app.setDefaultProperties(Map.of("logging.level.root", "OFF"));
        String ephemeralKey = UUID.randomUUID().toString() + UUID.randomUUID();
        try (var context = app.run("--spring.config.location=classpath:/application.properties",
                "--spring.profiles.active=" + profile, "--JWT_SECRET=" + ephemeralKey,
                "--spring.config.import=", "--DB_URL=jdbc:h2:mem:configuration-only",
                "--DB_USERNAME=fixture", "--DB_PASSWORD=fixture",
                "--spring.main.banner-mode=off")) {
            assertThat(context.getEnvironment().getProperty("jwt.secret.key").equals(ephemeralKey)).isTrue();
            assertThat(context.getEnvironment().getProperty("spring.datasource.url") != null).isTrue();
            assertThat(context.containsBean("dataSource")).isFalse();
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"local", "prod"})
    void externalFixtureFileSuppliesRequiredSettings(String profile, @TempDir Path directory) throws Exception {
        String ephemeralKey = UUID.randomUUID().toString() + UUID.randomUUID();
        Path fixture = directory.resolve("fixture.properties");
        Files.writeString(fixture, "DB_URL=jdbc:h2:mem:external-config\nDB_USERNAME=fixture\n"
                + "DB_PASSWORD=fixture\nJWT_SECRET=" + ephemeralKey + "\n");
        SpringApplication app = new SpringApplication(ConfigurationOnly.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setLogStartupInfo(false);
        app.setDefaultProperties(Map.of("logging.level.root", "OFF"));
        try (var context = app.run("--spring.config.location=classpath:/application.properties",
                "--spring.profiles.active=" + profile, "--spring.config.import=",
                "--spring.config.additional-location=" + fixture.toUri(),
                "--spring.main.banner-mode=off")) {
            assertThat(context.getEnvironment().getProperty("jwt.secret.key").equals(ephemeralKey)).isTrue();
            assertThat(context.getEnvironment().getProperty("spring.datasource.url")
                    .equals("jdbc:h2:mem:external-config")).isTrue();
            assertThat(context.containsBean("dataSource")).isFalse();
        }
    }
}
