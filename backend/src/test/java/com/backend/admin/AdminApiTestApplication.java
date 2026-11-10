package com.backend.admin;

import com.backend.config.*;
import com.backend.controller.member.MemberController;
import com.backend.mapper.member.AdminMemberMapper;
import com.backend.mapper.member.MemberMapper;
import com.backend.service.member.MemberAccessService;
import com.backend.controller.member.MemberErrorHandler;
import com.backend.security.JWTUtil;
import com.backend.service.member.AdminMemberService;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.mapper.MapperFactoryBean;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.UUID;

@Configuration
@EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class, JpaRepositoriesAutoConfiguration.class,
        OAuth2ClientAutoConfiguration.class})
@EnableTransactionManagement
@Import({AdminMemberSecurityConfiguration.class, SecurityConfiguration.class, LocalSecurityConfiguration.class,
        ProdSecurityConfiguration.class, MemberController.class, MemberErrorHandler.class, MemberAccessService.class, AdminMemberService.class})
class AdminApiTestApplication {
    @Bean JWTUtil jwtUtil() {
        // Ephemeral test key; no application configuration or credentials are loaded.
        return new JWTUtil(UUID.randomUUID().toString() + UUID.randomUUID());
    }
    @Bean DataSource dataSource() {
        return new DriverManagerDataSource("jdbc:h2:mem:" + UUID.randomUUID()
                + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
    }
    @Bean DataSourceTransactionManager transactionManager(DataSource ds) {
        return new DataSourceTransactionManager(ds);
    }
    @Bean SqlSessionFactory sqlSessionFactory(DataSource ds) throws Exception {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(ds);
        return factory.getObject();
    }
    @Bean MapperFactoryBean<AdminMemberMapper> adminMemberMapper(SqlSessionFactory factory) {
        MapperFactoryBean<AdminMemberMapper> bean = new MapperFactoryBean<>(AdminMemberMapper.class);
        bean.setSqlSessionFactory(factory);
        return bean;
    }
    @Bean MapperFactoryBean<MemberMapper> memberMapper(SqlSessionFactory factory) {
        MapperFactoryBean<MemberMapper> bean = new MapperFactoryBean<>(MemberMapper.class);
        bean.setSqlSessionFactory(factory);
        return bean;
    }
    @Bean UserDetailsService userDetailsService() {
        return name -> { throw new org.springframework.security.core.userdetails.UsernameNotFoundException(name); };
    }
    @Bean ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(ClientRegistration.withRegistrationId("isolated-test")
                .clientId("test").clientSecret("test").authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost/unused").authorizationUri("http://localhost/unused")
                .tokenUri("http://localhost/unused").userInfoUri("http://localhost/unused")
                .userNameAttributeName("id").build());
    }
}
