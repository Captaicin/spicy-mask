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

| 경로              | 설명                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| `index.ts`        | 콘텐츠 스크립트 엔트리. 오버레이 컨트롤러 초기화와 언로드 클린업을 담당합니다. |
| `filterConfig.ts` | 사용할 `FormFilter`를 선택하는 설정 파일입니다. 기본값으로 `LargeTextFormFilter`가 설정되어 있으며, 이 파일을 수정하여 `AllFormFilter`나 `TextFormFilter` 등으로 쉽게 교체할 수 있습니다. |

## `forms/` 서브시스템

폼 스캐닝과 미러링 UI 전반을 담당합니다.

| 경로                       | 설명                                                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FormFilter.ts`            | 폼 필터 추상 클래스와 메타데이터 타입을 정의합니다. `matches` 메서드 구현으로 대상 여부를 판별합니다.                                                                       |
| `FormOverlayController.ts` | DOM 스캔, 필터 적용, 미러링 동기화를 총괄합니다. MutationObserver로 DOM 변화를 감시합니다.                                                                                  |
| `FormScanner.ts`           | DOM에서 입력 컨트롤을 수집하고 가시성/상태 검사를 수행합니다.                                                                                                               |
| `FormMirrorManager.ts`     | 대상 폼 요소별로 shadow overlay를 만들고 React 렌더 루트를 관리합니다.                                                                                                      |
| `MirrorField.tsx`          | 단일 폼 요소를 미러링하는 React 컴포넌트. `DetectionEngine`으로부터 최종 탐지 결과를 받아 하이라이트 및 마스킹 동작을 orchestration합니다.              |
| `TargetHighlighter.ts`     | 대상 필드 위에 하이라이트 오버레이를 생성하고 동기화하는 핵심 클래스. `ResizeObserver`, `MutationObserver` 및 스크롤 가능한 부모 요소들을 추적하여 원본 필드의 크기, 위치, 스타일, 스크롤 상태 변화를 정교하게 감지하고, `requestAnimationFrame`을 통해 시각적 불일치 없이 오버레이를 업데이트합니다. |
| `TextHighlightOverlay.tsx` | 감지된 텍스트를 시각화하고 마스킹 액션, 스캔 도구, PII 관리 패널을 제공하는 React UI 레이어입니다. 팝업 위치 계산은 `@floating-ui/react`를 사용하고, `React.createPortal`을 통해 다른 UI에 가려지지 않도록 처리합니다. |
| `ManagementPanel.tsx`      | 현재 탐지된 PII, 무시된 값, 사용자 정의 규칙을 보고 관리(무시, 복원, 추가, 제거)하는 UI 컴포넌트입니다.                                                                     |
| `filters/`                 | 빌트인 필터 구현 모음 (`AllFormFilter`, `LargeTextFormFilter`, `MockFormFilter`, `TextFormFilter`).                                                                                                |

### 필터 구현

- `AllFormFilter`: 모든 입력/텍스트 영역을 허용하는 가장 포괄적인 필터.
- `LargeTextFormFilter`: 댓글, 게시글 본문 등 여러 줄을 입력하는 큰 텍스트 영역에 집중하는 필터입니다. 모든 `<input>` 요소는 제외하고, `<textarea>` 및 특정 조건을 만족하는 `contenteditable` 요소를 타겟으로 합니다. `contenteditable` 요소의 경우, `<form>` 내부에 있거나, `role="textbox"` 속성을 가지거나, 연결된 `<label>`이 있는 경우에만 타겟으로 삼아 노션(Notion)과 같은 문서 편집 페이지에서의 성능 저하를 방지합니다.
- `TextFormFilter`: 일반적인 텍스트 입력(`input`, `textarea` 등) 위주로 필터링하며 숨김/비활성 컨트롤을 제외합니다.
- `MockFormFilter`: mock/test 속성이나 텍스트를 기준으로 테스트용 필드를 선택합니다.

## 감지(`detection/`) 서브시스템

민감 텍스트 감지를 모듈화합니다.

| 경로 | 설명 |
| --- | --- |
| `DetectionEngine.ts` | 모든 탐지기를 실행하고 지능적으로 결과를 병합합니다. **중복된 탐지 결과를 해결할 때 더 구체적인(긴) 매치를 우선시하고, 길이가 같을 경우 탐지기 우선순위를 사용합니다.** 또한, 세션 동안 발견된 모든 고유 PII를 '사전' 형태로 기억하여 캐시로 활용하며, 사용자가 무시한 값의 목록을 관리합니다. |
| `detectors/BaseDetector.ts` | 모든 감지기의 기본 클래스. `detect` 메서드와 공통 입력 타입(`DetectionInput`)을 정의합니다. |
| `detectors/RegexDetector.ts` | 다중 정규식 패턴으로 PII 후보를 찾고, 추가 검증을 통해 정확도를 높이는 엔진입니다. 신용카드는 Luhn 알고리즘으로, **전화번호는 `libphonenumber-js` 라이브러리를 통해 검증**하여 오탐을 줄이고 글로벌 지원을 강화합니다. 내부에 캐시와 다양한 휴리스틱을 포함하여 성능과 정확성을 최적화합니다. |
| `detectors/UserRuleDetector.ts` | 사용자가 직접 추가한 텍스트 패턴(규칙)과 일치하는 모든 문자열을 탐지합니다. |
| `detectors/pii/piiPatterns.ts` | `RegexDetector`가 사용하는 PII 정규식 패턴과 우선순위를 정의합니다. **전화번호의 경우, 광범위한 후보를 찾아내기 위한 '순진한(naive)' 패턴을 사용하며, 핵심 검증 로직은 `RegexDetector`에 있습니다.** |
| `detectors/GeminiDetector.ts` | 백그라운드 Gemini 서비스를 호출하여 텍스트 내의 문맥적 PII(이름, 주소 등)를 탐지합니다. 서비스로부터 PII 후보값을 받은 후, "findall" 로직을 통해 텍스트 내 모든 일치 항목의 위치를 찾아 최종 `DetectionMatch` 객체를 생성합니다. |
| `detectors/geminiClient.ts` | `GeminiDetector`와 `background` 서비스 간의 통신을 담당하는 얇은 클라이언트입니다. `sendMessage` API 호출을 추상화하고, `RUN_GEMINI_PII_ANALYSIS` 메시지를 전송합니다. |
| `detectors/index.ts` | `DetectionEngine`에 사용될 기본 감지기(`RegexDetector`, `GeminiDetector`, `UserRuleDetector`)를 구성하고 내보냅니다. |
| `index.ts` | `DetectionEngine` 싱글턴 인스턴스를 생성하고 내보냅니다. |

## 마스킹(`masking/`)

- `plainTextMasker.ts`: 일반 `<input>`, `<textarea>`와 같은 단순 텍스트(string) 값에 대해 마스킹을 수행합니다.
- `contentEditableMasker.ts`: `contenteditable` 요소의 마스킹을 담당합니다. `TreeWalker`를 사용하여 HTML 구조(특히 줄바꿈)를 보존하면서, 텍스트 노드 레벨에서 안전하게 마스킹을 적용합니다.
- `index.ts`: 마스킹 유틸리티 재노출.

## 외부 연동 포인트

- `shared/logger`: 감지/마스킹/미러링 단계에서 통합 로깅을 제공합니다.
- `shared/dom`: shadow overlay 생성 유틸리티를 사용해 페이지 레이아웃을 유지합니다.
- `shared/constants`: overlay 호스트 ID 프리픽스를 공유합니다.

## 확장/테스트 가이드

- 새로운 감지기를 추가하려면 `BaseDetector`를 상속하고 `defaultDetectors` 배열에 추가하세요.
- 필터 전략 교체는 `filterConfig.ts`의 `injectedFilter`를 다른 구현으로 바꾸면 됩니다.
- UI 동작 디버깅은 `log` 출력과 `TargetHighlighter` 팝오버 상태를 활용하세요.
- `GeminiDetector`는 실제 `LanguageModel` API를 호출하므로, 비동기 흐름과 최종 반환되는 `DetectionMatch` 객체의 구조를 검증하는 테스트를 권장합니다.
