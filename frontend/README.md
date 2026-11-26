# Petmily 프런트엔드

React와 Vite로 구성했다. 개발 서버는 `/api`와 `/ws` 요청을 로컬 Spring Boot로 전달한다.

백엔드와 개발용 MariaDB를 준비한 뒤 저장소 루트에서 실행한다.

```sh
cd frontend
npm ci
npm run start:local
```

- [백엔드와 개발 DB 준비](../docs/LOCAL_DEVELOPMENT.md)
- [요청 흐름과 배포 구성](../docs/ARCHITECTURE.md)
- [개발 문서 목차](../docs/README.md)
