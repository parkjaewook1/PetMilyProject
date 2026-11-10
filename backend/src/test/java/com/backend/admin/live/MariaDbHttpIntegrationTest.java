package com.backend.admin.live;

import com.backend.mapper.board.*;
import com.backend.mapper.diary.*;
import com.backend.oauth2.CustomSuccessHandler;
import com.backend.security.JWTUtil;
import com.backend.service.board.BoardService;
import com.backend.service.member.*;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.FilterChainProxy;

import javax.sql.DataSource;
import javax.crypto.SecretKey;
import java.net.*;
import java.net.http.*;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@EnabledIfSystemProperty(named = "petmily.mariadb.url", matches = "jdbc:mariadb://127\\.0\\.0\\.1:[0-9]+/petmily_integration")
@SpringBootTest(classes = MariaDbHttpTestApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {"spring.config.location=optional:classpath:/integration-test-only.properties",
        "spring.main.banner-mode=off", "file.upload-dir=/tmp/petmily-maria-live/uploads/", "image.src.prefix=/uploads/"})
@org.springframework.test.context.ActiveProfiles("admin-mariadb-verification")
@org.junit.jupiter.api.extension.ExtendWith(org.springframework.boot.test.system.OutputCaptureExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MariaDbHttpIntegrationTest {
    @LocalServerPort int port;
    @Autowired DataSource ds;
    @Autowired JWTUtil jwt;
    @Autowired BCryptPasswordEncoder encoder;
    @Autowired ObjectMapper json;
    @Autowired FilterChainProxy chains;
    @MockBean BoardService boardService;
    @MockBean BoardMapper boardMapper;
    @MockBean BoardCommentMapper boardCommentMapper;
    @MockBean DiaryMapper diaryMapper;
    @MockBean DiaryBoardMapper diaryBoardMapper;
    @MockBean EmailSenderService emailSender;
    @MockBean CustomOAuth2UserService oauthUsers;
    @MockBean CustomSuccessHandler oauthSuccess;
    final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    final List<Map<String,Object>> results = new ArrayList<>();
    final Map<String,Object> findings = new LinkedHashMap<>();
    JdbcTemplate db;
    String adminToken, userToken, adminRefresh;
    final Path out = Path.of(System.getProperty("petmily.integration.output", "/tmp/petmily-maria-live/results"));

    HttpResponse<String> request(String method, String path, String token, String body, String contentType) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).timeout(Duration.ofSeconds(10));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (contentType != null) builder.header("Content-Type", contentType);
        builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }
    void status(String name, int expected, HttpResponse<String> response) throws Exception {
        results.add(Map.of("name",name,"expected",expected,"actual",response.statusCode(),"passed",expected==response.statusCode()));
        save(); assertEquals(expected,response.statusCode(),name);
    }
    void save() throws Exception {
        Files.createDirectories(out);
        json.writerWithDefaultPrettyPrinter().writeValue(out.resolve("http-results.json").toFile(), Map.of("checks",results,"findings",findings));
    }
    JsonNode login(String username) throws Exception {
        var res = request("POST","/api/member/login",null,"username="+URLEncoder.encode(username,java.nio.charset.StandardCharsets.UTF_8)+"&password=fixture-password", "application/x-www-form-urlencoded");
        status("real password login: "+username,200,res);
        findings.put("loginCookieHttpOnly",res.headers().allValues("set-cookie").stream().anyMatch(s->s.contains("HttpOnly")));
        return json.readTree(res.body());
    }
    @BeforeAll void initialize() throws Exception {
        db = new JdbcTemplate(ds);
        assertEquals("petmily_integration",db.queryForObject("SELECT DATABASE()",String.class));
        assertEquals("temporary-integration-fixtures-only", db.queryForObject("SELECT marker FROM petmily_test_marker",String.class));
        // Clean only the explicitly marked, newly created integration database.
        try (var connection = ds.getConnection(); var statement = connection.createStatement()) {
            var tables = new ArrayList<String>();
            try (var rows = statement.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name <> 'petmily_test_marker'")) {
                while (rows.next()) tables.add(rows.getString(1));
            }
            statement.execute("SET FOREIGN_KEY_CHECKS=0");
            try { for (String table : tables) statement.execute("DROP TABLE `" + table + "`"); }
            finally { statement.execute("SET FOREIGN_KEY_CHECKS=1"); }
        }
        db.execute("CREATE TABLE member(id INT PRIMARY KEY, name VARCHAR(100), username VARCHAR(100) UNIQUE, nickname VARCHAR(100) UNIQUE, password VARCHAR(100) NOT NULL, gender VARCHAR(10), nationality VARCHAR(20), birth_date DATE, phone_number VARCHAR(30), postcode INT, main_address VARCHAR(100), detailed_address VARCHAR(100), inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP, role VARCHAR(20)) ENGINE=InnoDB");
        db.execute("CREATE TABLE refresh_token(id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(100),refresh VARCHAR(1024),expiration DATETIME) ENGINE=InnoDB");
        db.execute("CREATE TABLE login_check(member_nickname VARCHAR(100) PRIMARY KEY,login_check BOOLEAN,login_logout_time DATETIME) ENGINE=InnoDB");
        for(String table:List.of("board","board_comment","board_like","board_report","diary","diary_comment","hospital_comment")) db.execute("CREATE TABLE "+table+"(member_id INT,FOREIGN KEY(member_id) REFERENCES member(id)) ENGINE=InnoDB");
        db.execute("CREATE TABLE profile(id INT AUTO_INCREMENT PRIMARY KEY,member_id INT,file_name VARCHAR(255),upload_path VARCHAR(255),FOREIGN KEY(member_id) REFERENCES member(id)) ENGINE=InnoDB");
        db.execute("CREATE TABLE friends(member_id INT,friend_id INT,FOREIGN KEY(member_id) REFERENCES member(id),FOREIGN KEY(friend_id) REFERENCES member(id)) ENGINE=InnoDB");
        db.execute("CREATE TABLE chat_message(sender_id INT,recipient_id INT,FOREIGN KEY(sender_id) REFERENCES member(id),FOREIGN KEY(recipient_id) REFERENCES member(id)) ENGINE=InnoDB");
        String hash=encoder.encode("fixture-password");
        for(int id:List.of(7,8,9,10,11,99)) db.update("INSERT INTO member(id,name,username,nickname,password,gender,nationality,birth_date,phone_number,postcode,main_address,detailed_address,role) VALUES(?,?,?,?,?,'male','test','1990-01-01','fixture-phone',12345,'fixture-address','fixture-detail',?)",id,"fixture-name",id==99?"admin@example.test":"user"+id+"@example.test","fixture"+id,hash,id==99?"ADMIN":"USER");
        findings.put("databaseVersion",db.queryForObject("SELECT VERSION()",String.class));
        findings.put("schema",db.queryForList("SELECT table_name,engine FROM information_schema.tables WHERE table_schema=DATABASE()"));
        findings.put("columns",db.queryForList("SELECT column_name,column_type,is_nullable FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='member' ORDER BY ordinal_position"));
        findings.put("foreignKeys",db.queryForList("SELECT table_name,column_name,referenced_table_name,referenced_column_name FROM information_schema.key_column_usage WHERE table_schema=DATABASE() AND referenced_table_name IS NOT NULL"));
        findings.put("filterChainOrder",chains.getFilterChains().stream().map(Object::toString).toList());
        var adminLogin=login("admin@example.test"); adminToken=adminLogin.get("access").asText(); adminRefresh=adminLogin.get("refresh").asText(); userToken=login("user7@example.test").get("access").asText();save();
    }
    @Test @Order(1) void actualHttpAuthorizationAndJson() throws Exception {
        status("anonymous list",401,request("GET","/api/member/list",null,null,null));
        status("user list",403,request("GET","/api/member/list",userToken,null,null));
        var res=request("GET","/api/member/list?page=1&pageSize=10",adminToken,null,null);status("admin list",200,res);
        var row=json.readTree(res.body()).get("members").get(0);var names=new HashSet<String>();row.fieldNames().forEachRemaining(names::add);
        assertEquals(Set.of("id","username","nickname","gender","birthDate","inserted","role"),names);
        assertFalse(res.body().contains("fixture-address"));findings.put("adminListFields",names);save();
        status("modified signature",401,request("GET","/api/member/list",adminToken.substring(0,adminToken.lastIndexOf('.')+1)+"invalid",null,null));
        SecretKey key=(SecretKey)org.springframework.test.util.ReflectionTestUtils.getField(jwt,"secretKey");
        String expired=io.jsonwebtoken.Jwts.builder().claim("category","access").claim("username","test").claim("role","ROLE_ADMIN").claim("userId",99).expiration(new Date(1)).signWith(key).compact();
        status("expired JWT",401,request("GET","/api/member/list",expired,null,null));
        status("refresh as access",401,request("GET","/api/member/list",jwt.createRefreshToken("test","ROLE_ADMIN",99),null,null));
        status("query URL anonymous DELETE",401,request("DELETE","/api/member/8?source=test",null,null,null));
        status("query URL user DELETE",403,request("DELETE","/api/member/8?source=test",userToken,null,null));
    }
    @Test @Order(2) void realTransactionsAndForeignKeys() throws Exception {
        status("user cannot delete",403,request("DELETE","/api/member/8",userToken,null,null));
        status("missing member",404,request("DELETE","/api/member/123456",adminToken,null,null));
        status("administrator protected",409,request("DELETE","/api/member/99",adminToken,null,null));
        for(String table:List.of("diary","diary_comment","board","board_comment","board_like","board_report","hospital_comment")){
            db.update("INSERT INTO "+table+" VALUES(8)");status(table+" blocks deletion",409,request("DELETE","/api/member/8",adminToken,null,null));
            assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM "+table+" WHERE member_id=8",Integer.class));db.update("DELETE FROM "+table+" WHERE member_id=8");
        }
        db.execute("CREATE TABLE unknown_dependency(member_id INT,FOREIGN KEY(member_id) REFERENCES member(id)) ENGINE=InnoDB");
        db.update("INSERT INTO unknown_dependency VALUES(8)");db.update("INSERT INTO refresh_token(username,refresh) VALUES('user8@example.test','fixture-only')");db.update("INSERT INTO login_check(member_nickname) VALUES('fixture8')");
        status("FK failure is 409",409,request("DELETE","/api/member/8",adminToken,null,null));
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM refresh_token WHERE username='user8@example.test'",Integer.class));
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM login_check WHERE member_nickname='fixture8'",Integer.class));
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM member WHERE id=8",Integer.class));
        db.update("DELETE FROM unknown_dependency");
        status("isolated member deletion",204,request("DELETE","/api/member/8",adminToken,null,null));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM member WHERE id=8",Integer.class));
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM refresh_token WHERE username='user8@example.test'",Integer.class));
        findings.put("rollbackVerified",true);save();
    }
    HttpResponse<String> refresh(String refresh) throws Exception {
        // A stale/broken access header must not override independently authenticated refresh credentials.
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/member/reissue"))
                .header("Refresh-Token",refresh).header("Authorization","Bearer stale-access-header")
                .POST(HttpRequest.BodyPublishers.noBody()).build();
        return http.send(request,HttpResponse.BodyHandlers.ofString());
    }
    @Test @Order(3) void roleDemotionImmediatelyBlocksOldAndRefreshedJwt() throws Exception {
        db.update("UPDATE member SET role='USER' WHERE id=99");
        try {
            status("demoted existing JWT list",403,request("GET","/api/member/list",adminToken,null,null));
            status("demoted existing JWT delete",403,request("DELETE","/api/member/11",adminToken,null,null));
            var publicView=request("GET","/api/member/7",adminToken,null,null);
            status("demoted admin receives public profile only",200,publicView);assertFalse(json.readTree(publicView.body()).has("mainAddress"));
            status("demoted admin cannot update another member",403,request("PUT","/api/member/edit/7",adminToken,profileBody(null),"application/json"));
            var rotated=refresh(adminRefresh);status("demoted refresh rotation",200,rotated);
            String newAccess=json.readTree(rotated.body()).get("access").asText();
            assertEquals("ROLE_USER",jwt.getRole(newAccess));
            status("demoted refreshed JWT",403,request("GET","/api/member/list",newAccess,null,null));
            status("refresh replay",401,refresh(adminRefresh));
            String fresh=login("admin@example.test").get("access").asText();
            status("demoted fresh login JWT",403,request("GET","/api/member/list",fresh,null,null));
        } finally {db.update("UPDATE member SET role='ADMIN' WHERE id=99");save();}
    }
    private String profileBody(String password) throws Exception {
        var body=new LinkedHashMap<String,Object>();
        body.put("nickname","fixture7");body.put("gender","male");body.put("nationality","test");body.put("name","fixture-name");
        body.put("birthDate","1990-01-01");body.put("phoneNumber","fixture-phone");body.put("postcode",12345);
        body.put("mainAddress","fixture-address");body.put("detailedAddress","fixture-detail");
        if(password!=null)body.put("password",password);
        return json.writeValueAsString(body);
    }
    @Test @Order(4) void profileResponsesAreAllowlistedAndOptionalPasswordPreserved() throws Exception {
        var own=request("GET","/api/member/7",userToken,null,null);status("own profile GET",200,own);
        var other=request("GET","/api/member/9",userToken,null,null);status("public profile GET",200,other);
        var publicFields=new HashSet<String>();json.readTree(other.body()).fieldNames().forEachRemaining(publicFields::add);
        assertEquals(Set.of("id","nickname","imageUrl"),publicFields);
        var privateFields=new HashSet<String>();json.readTree(own.body()).fieldNames().forEachRemaining(privateFields::add);
        assertEquals(Set.of("id","nickname","imageUrl","username","name","gender","nationality","birthDate","phoneNumber","postcode","mainAddress","detailedAddress","inserted"),privateFields);
        assertFalse(own.body().contains("password"));assertFalse(other.body().contains("fixture-address"));
        var adminDetail=request("GET","/api/member/9",adminToken,null,null);status("current admin detail",200,adminDetail);
        assertTrue(json.readTree(adminDetail.body()).has("mainAddress"));assertFalse(json.readTree(adminDetail.body()).has("password"));
        String original=db.queryForObject("SELECT password FROM member WHERE id=7",String.class);
        for(String mode:List.of("omitted","empty","null")){
            String body=profileBody(mode.equals("empty")?"":null);
            if(mode.equals("null")){var node=(com.fasterxml.jackson.databind.node.ObjectNode)json.readTree(body);node.putNull("password");body=json.writeValueAsString(node);}
            status(mode+" password PUT",200,request("PUT","/api/member/edit/7",userToken,body,"application/json"));
            assertEquals(original,db.queryForObject("SELECT password FROM member WHERE id=7",String.class),mode);
            login("user7@example.test");
        }
        status("other profile PUT forbidden",403,request("PUT","/api/member/edit/9",userToken,profileBody(null),"application/json"));
        findings.put("publicProfileFields",publicFields);findings.put("privateProfileFields",privateFields);
        findings.put("optionalPasswordHashPreserved",true);save();
    }
    @Test @Order(5) void explicitPasswordChangeIsValidatedAndEncodedExactlyOnce() throws Exception {
        String original=db.queryForObject("SELECT password FROM member WHERE id=7",String.class);
        for(String invalid:List.of("weak","   ",original)){
            var response=request("PUT","/api/member/edit/7",userToken,profileBody(invalid),"application/json");
            status("invalid new password rejected",400,response);assertFalse(response.body().contains(invalid));
            assertEquals(original,db.queryForObject("SELECT password FROM member WHERE id=7",String.class));
        }
        status("explicit valid password PUT",200,request("PUT","/api/member/edit/7",userToken,profileBody("ChangedPass1!"),"application/json"));
        String encoded=db.queryForObject("SELECT password FROM member WHERE id=7",String.class);
        assertNotEquals(original,encoded);assertTrue(encoder.matches("ChangedPass1!",encoded));
        status("old password rejected",401,request("POST","/api/member/login",null,"username=user7%40example.test&password=fixture-password","application/x-www-form-urlencoded"));
        status("new password accepted",200,request("POST","/api/member/login",null,"username=user7%40example.test&password=ChangedPass1%21","application/x-www-form-urlencoded"));
        db.update("UPDATE member SET password=? WHERE id=7",original);
        findings.put("passwordChangeVerified",true);save();
    }
    @Test @Order(6) void deletedAccountCannotUseOldAccessOrRefreshTokens() throws Exception {
        db.update("INSERT INTO member(id,username,nickname,password,role) VALUES(100,'deleted@example.test','deleted-fixture',?,'ADMIN')",encoder.encode("fixture-password"));
        var auth=login("deleted@example.test");String token=auth.get("access").asText(),refresh=auth.get("refresh").asText();
        db.update("DELETE FROM member WHERE id=100");
        status("deleted account admin JWT",401,request("GET","/api/member/list",token,null,null));
        status("deleted account profile JWT",401,request("GET","/api/member/7",token,null,null));
        status("deleted account refresh",401,refresh(refresh));
        status("malformed refresh",401,refresh("malformed-refresh"));
    }
    @Test @Order(7) void ordinaryResponsesAndLogsDoNotEchoSecrets(org.springframework.boot.test.system.CapturedOutput output) throws Exception {
        org.mockito.Mockito.when(emailSender.createMail("user7@example.test")).thenReturn("mail-only-secret");
        var email=request("POST","/api/member/sendEmail",userToken,"{\"username\":\"user7@example.test\"}","application/json");
        status("recovery response does not return temporary password",200,email);assertFalse(email.body().contains("mail-only-secret"));
        var malformed=request("PUT","/api/member/edit/7",userToken,"{\"password\":{\"secret\":\"input-secret-marker\"}}","application/json");
        status("malformed credential input",400,malformed);assertFalse(malformed.body().contains("input-secret-marker"));
        assertFalse(output.getAll().contains("fixture-password"));assertFalse(output.getAll().contains("ChangedPass1!"));
        assertFalse(output.getAll().contains(adminToken));assertFalse(output.getAll().contains(adminRefresh));
    }
    @Test @Order(99) @EnabledIfSystemProperty(named="petmily.browser",matches="true")
    void browserWindow() throws Exception {
        adminToken=login("admin@example.test").get("access").asText();
        Files.deleteIfExists(Path.of("/tmp/petmily-maria-live/browser.done"));
        Path bridge=Path.of("/tmp/petmily-maria-live/browser.json");
        json.writeValue(bridge.toFile(),Map.of("port",port,"id",99));
        Files.setPosixFilePermissions(bridge,java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
        long end=System.currentTimeMillis()+150000;
        while(!Files.exists(Path.of("/tmp/petmily-maria-live/browser.done"))&&System.currentTimeMillis()<end)Thread.sleep(250);
        assertTrue(Files.exists(Path.of("/tmp/petmily-maria-live/browser.done")),"Browser verification timed out");
        assertEquals("passed",Files.readString(Path.of("/tmp/petmily-maria-live/browser.done")),"Browser verification did not pass");
        Files.deleteIfExists(bridge);
    }
}
