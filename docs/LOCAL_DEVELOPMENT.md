# 로컬 개발 환경

## 개발 환경

JDK 21, Node.js/npm, 별도의 개발용 MariaDB가 필요하다. 현재 application 설정은 환경 변수/비공개 외부 파일을 참조한다. 비공개 원본과 실제 자격증명은 저장소 밖에 보관한다.

1. [비밀값 없는 외부 설정 예시](publication/config/application.example.properties)를 별도 로컬 파일로 복사한다.
2. 사용자 소유 개발 DB·스키마, JWT 키, 필요한 OAuth/메일 환경 변수를 저장소 밖에서 준비한다. 개발 DB의 스키마는 별도로 준비해 적용한다. 저장소에서는 SQL 원본·백업을 배포하지 않으며 자동 DB 초기화 기능은 제공하지 않는다.
3. 전체 앱은 외부 설정으로 기존 application 파일을 **대체**해 실행한다. 아래 명령은 프로젝트 루트에서 시작한다.

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

Vite의 기본 `/api`·`/ws` 프록시는 localhost:8080을 대상으로 한다. 외부 설정 예시는 값을 채워 넣기 위한 템플릿이다. 해당 예시로 실제 메일·OAuth에 연결하는 흐름은 확인하지 않았다.

## 격리 테스트

선택 회귀와 빌드는 아래 명령으로 실행한다.

```sh
cd backend
./gradlew test --tests 'com.backend.admin.*' build
```

MariaDB 통합 검사는 별도로 준비한 표식 있는 loopback 전용 `petmily_integration` DB가 필요하다. 일반 회귀 실행은 이 검사 8개를 건너뛴다. 기본 `contextLoads`는 실제 DB 설정을 읽을 수 있으므로 위 선택 검사와 구분한다.

```sh
cd backend
./gradlew mariaDbIntegrationTest \
  -Dpetmily.mariadb.url=jdbc:mariadb://127.0.0.1:13317/petmily_integration
```

[검증 결과와 범위](TESTING.md)
