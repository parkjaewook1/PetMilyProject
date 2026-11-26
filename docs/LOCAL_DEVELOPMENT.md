# 로컬 개발 환경

필요 환경은 JDK 21, Node/npm, 별도의 개발용 MariaDB입니다. 현재 application 설정은 환경 변수/비공개 외부 파일을 참조합니다. 비공개 원본과 실제 자격증명은 공개 대상에서 제외합니다. 아래 예시는 저장소 밖의 개발용 설정을 명시적으로 지정합니다.

1. [비밀값 없는 외부 설정 예시](publication/config/application.example.properties)를 별도 로컬 파일로 복사합니다.
2. 사용자 소유 개발 DB·스키마, JWT 키, 필요한 OAuth/메일 환경 변수를 저장소 밖에서 준비합니다. 예시는 placeholder이며 운영 값을 포함하지 않습니다. SQL 예시·백업은 출처가 확인되지 않아 공개본에서 제외하며 자동 DB 초기화를 제공하지 않습니다.
3. 전체 앱은 외부 설정으로 기존 application 파일을 **대체**해 실행합니다. 예시 경로는 프로젝트 루트 기준입니다.

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

Vite의 기본 `/api`·`/ws` 프록시는 localhost:8080을 대상으로 합니다. DB·메일·OAuth 값과 스키마를 갖추지 않은 전체 앱의 시작 성공을 보증하지 않습니다. 외부 설정 예시 자체를 실제 외부 서비스에 연결해 검증하지 않았습니다.

운영 설정을 사용하지 않는 기존 격리 회귀는 다음으로 실행합니다.

```sh
cd backend
./gradlew test --tests 'com.backend.admin.*' build
```

MariaDB 통합 검사는 별도로 준비한 표식 있는 loopback 전용 `petmily_integration` DB가 필요합니다. 일반 회귀 실행에서는 live 검사 8개가 의도적으로 skip됩니다. 기존 전체 `contextLoads`는 실제 DB 설정을 읽을 수 있으므로 위 선택 검사와 구분합니다.

```sh
cd backend
./gradlew mariaDbIntegrationTest \
  -Dpetmily.mariadb.url=jdbc:mariadb://127.0.0.1:13317/petmily_integration
```

[검증 결과와 범위](publication/VERIFICATION.md)
