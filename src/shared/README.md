# Shared 유틸리티

## 역할

- 백그라운드/콘텐츠/팝업 간에 재사용되는 헬퍼와 타입을 모아둔 레이어입니다.
- 메시징, DOM 유틸리티, 스토리지, 로깅을 캡슐화하여 크로스-모듈 일관성을 제공합니다.

## 구성 파일

| 경로           | 설명                                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`     | 런타임 메시지 타입(`Msg`, `MsgResponse`)과 감지 결과(`GeminiEntityType`, `GeminiScanMatch`)를 정의합니다. 새 메시지를 추가하거나 감지 스키마를 확장할 때 업데이트해야 합니다. |
| `messaging.ts` | `chrome.runtime.sendMessage`/`onMessage`를 Promise 기반으로 감싼 통신 유틸리티. 타입 세이프 라우팅을 제공합니다.                                                              |
| `logger.ts`    | 콘솔 로깅 래퍼. 모든 로그에 `[Spicy Mask]` 프리픽스를 붙입니다. `log`/`warn`/`error`를 제공합니다.                                                                            |
| `storage.ts`   | `chrome.storage.sync`에 대한 Promise 기반 get/set 래퍼와 상수 키(`STORAGE_KEYS`).                                                                                             |
| `dom.ts`       | shadow DOM 오버레이 호스트를 생성/제거하는 `createOverlayShadow`. 폼 미러링 UI가 사용합니다.                                                                                  |
| `constants.ts` | 모듈 간 공유 상수(`MIRROR_OVERLAY_PREFIX`) 정의.                                                                                                                              |

## 사용 시 고려사항

- 메시지 타입을 확장할 때는 백그라운드 서비스 워커와 팝업 양쪽에서 동일한 타입을 참조하도록 `types.ts`를 단일 소스로 유지하세요.
- 감지 타입(`GeminiEntityType`)은 `phone_number`, `email`, `pattern_match`를 포함하며 `reason` 필드를 통해 감지 근거를 전달합니다. 백그라운드/콘텐츠 양쪽에서 이 스키마를 준수해야 합니다.
- `createOverlayShadow`는 문서 body에 직접 호스트를 추가하므로, 호출 후 `destroy()`를 반드시 실행해야 메모리 누수를 막을 수 있습니다.
- 스토리지 API는 동기적으로 실패 콜백을 제공하지 않으므로, 필요 시 `chrome.runtime.lastError` 확인 로직을 추가하세요.
