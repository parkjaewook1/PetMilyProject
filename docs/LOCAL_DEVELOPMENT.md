# 로컬 개발 환경

## 개발 환경

JDK 21, Node.js/npm, 별도의 개발용 MariaDB가 필요합니다. application 설정에서는 환경 변수와 외부 설정 파일을 참조합니다. 실제 자격증명과 비공개 설정 파일은 저장소 외부에 보관합니다.

1. [비밀값 없는 외부 설정 예시](publication/config/application.example.properties)를 별도 로컬 파일로 복사합니다.
2. 별도의 개발용 DB와 스키마를 준비하고, JWT 키와 필요한 OAuth·메일 환경 변수를 저장소 외부에 설정합니다. SQL 원본과 백업은 공개하지 않으며 자동 DB 초기화 기능은 제공하지 않습니다.
3. 전체 애플리케이션 실행 시 외부 설정으로 기존 application 파일을 **대체**합니다. 프로젝트 루트에서 아래 명령을 실행합니다.

```sh
cd backend
./gradlew bootJar
cd ..
java --enable-preview -jar backend/build/libs/backend-0.0.1-SNAPSHOT.jar \
  --spring.config.location=file:/absolute/path/to/your-local-application.properties
```

```sh
cd frontend
npm ci
npm run start:local
```

Vite의 기본 `/api`와 `/ws` 프록시는 localhost:8080으로 요청을 전달합니다. 외부 설정 예시에는 각 환경에 맞는 값을 입력해야 하며, 이 예시를 사용한 실제 메일·OAuth 연결은 아직 검증하지 않았습니다.

## 격리 테스트

회원·관리자 회귀 테스트와 빌드는 아래 명령으로 실행할 수 있습니다.

```sh
cd backend
./gradlew test --tests 'com.backend.admin.*' build
```

MariaDB 통합 테스트에는 표식이 있는 loopback 전용 `petmily_integration` DB가 필요합니다. 일반 회귀 테스트에서는 해당 통합 테스트 8개를 건너뜁니다. 기본 `contextLoads`는 실제 DB 설정을 읽을 수 있으므로 격리 테스트에서 제외합니다.

```sh
cd backend
./gradlew mariaDbIntegrationTest \
  -Dpetmily.mariadb.url=jdbc:mariadb://127.0.0.1:13317/petmily_integration
```

[검증 결과와 범위](TESTING.md)
