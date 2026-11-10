package com.backend.admin;

import com.backend.controller.place.BoundarySetController;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BoundaryResourceTest {
    @Test
    void boundaryApiServesPublicGeographyWithoutPrivateResources() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new BoundarySetController()).build();
        var response = mvc.perform(get("/api/boundarySet"))
                .andExpect(status().isOk()).andReturn().getResponse();
        var root = new ObjectMapper().readTree(response.getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        assertThat(root.path("type").asText()).isEqualTo("FeatureCollection");
        assertThat(root.path("features").size()).isEqualTo(17);
        for (var feature : root.path("features")) {
            assertThat(feature.path("properties").size()).isEqualTo(3);
            assertThat(feature.path("properties").has("CTPRVN_CD")).isTrue();
            assertThat(feature.path("properties").has("CTP_KOR_NM")).isTrue();
            assertThat(feature.path("properties").has("CTP_ENG_NM")).isTrue();
            assertThat(feature.path("geometry").path("type").asText()).isEqualTo("Polygon");
        }
        assertThat(getClass().getClassLoader().getResource("secret/custom.properties")).isNull();
    }
}
