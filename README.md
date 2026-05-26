# Simple Clock Stopwatch

오프라인에서도 사용할 수 있는 정적 PWA 스톱워치입니다.

## 기능

- 시작, 정지, 초기화
- 랩 기록 및 전체 기록 삭제
- 새로고침 후에도 경과 시간과 랩 기록 복원
- 서비스 워커 기반 오프라인 캐시
- GitHub Pages 배포용 정적 파일 구성

## 로컬 실행

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.
