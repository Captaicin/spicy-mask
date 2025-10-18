# Background 서비스 워커

## 역할
- Chrome 확장 프로그램의 서비스 워커로서 옵션/팝업/콘텐츠 스크립트가 보내는 런타임 메시지를 처리합니다.
- 설치 이벤트 훅을 잡아 초기화를 수행할 수 있는 확장 포인트를 제공합니다.

## 구성 파일
| 경로 | 설명 |
| --- | --- |
| `index.ts` | 서비스 워커 엔트리 포인트. 설치 이벤트 등록과 메시지 라우팅을 담당합니다. |
| `geminiService.ts` | `RUN_GEMINI_PII_ANALYSIS` 메시지에 응답합니다. `LanguageModel` API의 프록시 역할을 하여 LLM을 호출하고 원본 PII 제안을 반환합니다. |

## 주요 API
### 설치 훅
```ts
chrome.runtime.onInstalled.addListener(() => {})
```
- 확장 프로그램 설치/업데이트 시 호출됩니다.
- 현재는 no-op이며, 권한 요청이나 기본 설정 초기화 로직을 여기에 추가할 수 있습니다.

### 메시지 엔드포인트
```ts
onMessage(async (message) => { /* ... */ })
```
- `src/shared/messaging.ts`의 `onMessage` 래퍼를 사용해 Promise 기반 라우팅을 제공합니다.
- 기본 구현은 `PING` 타입에 `pong`을 응답하고, `RUN_GEMINI_PII_ANALYSIS`에 대해서는 비동기로 `geminiService.ts`를 호출해 결과를 반환하며, 미지정 타입에는 에러를 반환합니다.
- 새 메시지를 지원하려면 `switch` 블록에 케이스를 추가하고 `Msg`/`MsgResponse` 타입을 업데이트하세요.

## 확장 포인트
- **추가 메시지 핸들러**: 상황별 비즈니스 로직을 케이스로 분기합니다.
- **원격 감지 통합**: `geminiService.ts`는 실제 `LanguageModel` API 구현을 포함하고 있으며, 다른 종류의 프롬프트나 모델을 지원하도록 확장될 수 있습니다.
- **백그라운드 작업 예약**: 크롬 알람, 스토리지 변경 리스너 등을 이 모듈에 넣을 수 있습니다.
