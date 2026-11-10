package com.backend.admin.live;

import com.backend.config.*;
import com.backend.controller.member.MemberController;
import com.backend.controller.member.ReissueController;
import com.backend.controller.member.MemberErrorHandler;
import com.backend.controller.friends.FriendsController;
import com.backend.mapper.member.MemberMapper;
import com.backend.mapper.friends.FriendsMapper;
import com.backend.security.JWTUtil;
import com.backend.service.member.*;
import com.backend.service.friends.FriendsService;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.apache.ibatis.session.SqlSessionFactory;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.UUID;

@Configuration
@Profile("admin-mariadb-verification")
@EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class,
        JpaRepositoriesAutoConfiguration.class, OAuth2ClientAutoConfiguration.class})
@EnableTransactionManagement
@MapperScan(basePackageClasses = {MemberMapper.class, FriendsMapper.class})
@Import({AdminMemberSecurityConfiguration.class, SecurityConfiguration.class, LocalSecurityConfiguration.class,
        ProdSecurityConfiguration.class, MemberController.class, MemberErrorHandler.class, ReissueController.class, MemberAccessService.class, AdminMemberService.class,
        MemberService.class, CustomUserDetailsService.class, FriendsController.class, FriendsService.class})
class MariaDbHttpTestApplication {
    @Bean JWTUtil jwtUtil() { return new JWTUtil(UUID.randomUUID().toString() + UUID.randomUUID()); }
    @Bean DataSource dataSource() {
        String url = System.getProperty("petmily.mariadb.url", "");
        if (!url.matches("jdbc:mariadb://127\\.0\\.0\\.1:[0-9]+/petmily_integration")) {
            throw new IllegalArgumentException("Only an explicitly named loopback integration database is allowed");
        }
        return new DriverManagerDataSource(url, "petmily_test", "isolated-fixture-only");
    }
    @Bean DataSourceTransactionManager transactionManager(DataSource ds) { return new DataSourceTransactionManager(ds); }
    @Bean SqlSessionFactory sqlSessionFactory(DataSource ds) throws Exception {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean(); factory.setDataSource(ds);
        org.apache.ibatis.session.Configuration config = new org.apache.ibatis.session.Configuration();
        config.setMapUnderscoreToCamelCase(true); factory.setConfiguration(config);
        return factory.getObject();
    }
    @Bean ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(ClientRegistration.withRegistrationId("isolated-test")
                .clientId("test").clientSecret("test").authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost/unused").authorizationUri("http://localhost/unused")
                .tokenUri("http://localhost/unused").userInfoUri("http://localhost/unused")
                .userNameAttributeName("id").build());
    }
}
