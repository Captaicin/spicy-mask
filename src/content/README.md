# Content 스크립트 모듈

## 역할
- 브라우저 페이지 위에서 동작하며 폼 요소를 스캔하고 미러링 UI를 주입합니다.
- 민감 텍스트 감지를 위해 감지 엔진과 마스킹 로직을 실행합니다.
- 필터 전략(`FormFilter`)을 통해 미러링 대상 폼을 결정합니다.
- 사용자 트리거(Start Scan)와 자동 감지를 구분해 결과를 통합하고, 수동 감지 결과를 마스킹 후에도 유지합니다.

## 실행 흐름
1. `index.ts`가 DOM 준비 상태를 확인해 `init()`을 호출합니다.
2. `FormOverlayController`가 필터 구성(`filterConfig.ts`)을 읽고 DOM 스캐닝을 시작합니다.
3. `FormScanner`가 대상 폼 요소를 수집하고, 필터가 최종 대상 목록을 결정합니다.
4. `FormMirrorManager`가 각 대상에 대한 shadow DOM 오버레이와 `MirrorField` React 컴포넌트를 렌더링합니다.
5. `MirrorField`는 감지 엔진(`detection/`)과 마스킹 모듈(`masking/`)을 연동해 하이라이트 및 마스킹 UI를 구성합니다.
6. 페이지 언로드 시 컨트롤러가 리소스를 정리합니다.

## 상위 파일
| 경로 | 설명 |
| --- | --- |
| `index.ts` | 콘텐츠 스크립트 엔트리. 오버레이 컨트롤러 초기화와 언로드 클린업을 담당합니다. |
| `filterConfig.ts` | 현재 사용할 `FormFilter` 인스턴스와 기본 옵션을 정의합니다. 핫스왑 지점입니다. |

## `forms/` 서브시스템
폼 스캐닝과 미러링 UI 전반을 담당합니다.

| 경로 | 설명 |
| --- | --- |
| `FormFilter.ts` | 폼 필터 추상 클래스와 메타데이터 타입을 정의합니다. `matches` 메서드 구현으로 대상 여부를 판별합니다. |
| `FormOverlayController.ts` | DOM 스캔, 필터 적용, 미러링 동기화를 총괄합니다. MutationObserver로 DOM 변화를 감시합니다. |
| `FormScanner.ts` | DOM에서 입력 컨트롤을 수집하고 가시성/상태 검사를 수행합니다. |
| `FormMirrorManager.ts` | 대상 폼 요소별로 shadow overlay를 만들고 React 렌더 루트를 관리합니다. |
| `MirrorField.tsx` | 단일 폼 요소를 미러링하는 React 컴포넌트. 감지, 하이라이트, 마스킹 동작을 orchestration 하며, 수동 감지(Gemini) 결과를 캐시했다가 자동 감지 결과와 병합합니다. |
| `TargetHighlighter.ts` | 대상 필드 위에 하이라이트 레이어를 띄우고 팝오버/버튼 인터랙션을 처리합니다. 감지 트리거(`auto`/`manual`) 메타데이터를 오버레이로 전달합니다. |
| `TextHighlightOverlay.tsx` | 감지된 텍스트를 시각화하고 마스킹 액션을 제공하는 React UI 레이어입니다. Start Scan 도구 팝오버, 지연 상태(Scanning…), 감지 결과 요약 및 추가 Mask all 버튼을 렌더링합니다. |
| `filters/` | 빌트인 필터 구현 모음 (`AllFormFilter`, `MockFormFilter`, `TextFormFilter`). |

### 필터 구현
- `AllFormFilter`: 모든 입력/텍스트 영역을 허용하는 가장 포괄적인 필터.
- `TextFormFilter`: 텍스트 입력 위주로 필터링하며 숨김/비활성 컨트롤을 제외합니다.
- `MockFormFilter`: mock/test 속성이나 텍스트를 기준으로 테스트용 필드를 선택합니다.

## 감지(`detection/`) 서브시스템
민감 텍스트 감지를 모듈화합니다.

| 경로 | 설명 |
| --- | --- |
| `DetectionEngine.ts` | 등록된 `BaseDetector` 인스턴스를 순회해 감지 결과를 집계합니다. 비동기 감지를 지원하고, 감지 트리거에 따라 결과를 dedupe 합니다. |
| `detectors/BaseDetector.ts` | 감지기 기본 클래스와 입력/출력 타입 정의. `DetectionMatch`에 `entityType`과 `reason` 필드를 포함합니다. |
| `detectors/RegexDetector.ts` | 정규식 기반 감지기. 구성 시 커스텀 패턴을 받을 수 있으며 감지 사유(`reason`)를 제공합니다. |
| `detectors/MockDetector.ts` | 데모용 고정 토큰(`asdfas`) 탐지기. 기본 감지 배열에 포함됩니다. |
| `detectors/GeminiDetector.ts` | 수동(Start Scan) 실행 시에만 백그라운드 `geminiScan`을 호출하며, 전화번호/이메일 후보와 감지 사유를 반환합니다. |
| `detectors/index.ts` | 감지기 컬렉션을 내보내고 기본 감지기 세트를 구성합니다. |
| `index.ts` | `DetectionEngine` 싱글턴을 생성하고 재노출합니다. |

## 마스킹(`masking/`)
- `masker.ts`: 감지된 인덱스 범위를 기반으로 문자열을 마스킹합니다. 겹치는 범위를 정리하고 결과와 변경 여부를 반환합니다.
- `index.ts`: 마스킹 유틸리티 재노출.

## 외부 연동 포인트
- `shared/logger`: 감지/마스킹/미러링 단계에서 통합 로깅을 제공합니다.
- `shared/dom`: shadow overlay 생성 유틸리티를 사용해 페이지 레이아웃을 유지합니다.
- `shared/constants`: overlay 호스트 ID 프리픽스를 공유합니다.

## 확장/테스트 가이드
- 새로운 감지기를 추가하려면 `BaseDetector`를 상속하고 `defaultDetectors` 배열에 추가하세요.
- 필터 전략 교체는 `filterConfig.ts`의 `injectedFilter`를 다른 구현으로 바꾸면 됩니다.
- UI 동작 디버깅은 `log` 출력과 `TargetHighlighter` 팝오버 상태를 활용하세요.
- Start Scan 시 3초 지연(백그라운드 스텁)을 고려해 비동기 흐름을 검증하세요. 마스킹 후에도 Gemini 감지 결과가 유지되는지 확인하는 스냅샷 테스트를 권장합니다.
