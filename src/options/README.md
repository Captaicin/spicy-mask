# Options 페이지

## 역할

- 확장 프로그램 옵션 페이지의 React 번들 엔트리입니다.
- 개발자에게 사용 가능한 `FormFilter` 구현과 동작 개요를 설명하는 정적 안내 페이지를 렌더링합니다.

## 구성 파일

| 경로          | 설명                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `index.html`  | 옵션 페이지 HTML 셸. `#root` 컨테이너와 `main.tsx` 번들 진입점을 정의합니다.                                    |
| `main.tsx`    | React 18 `createRoot` 부트스트랩 코드. 전역 스타일(`../styles/globals.css`)을 import 합니다.                    |
| `Options.tsx` | 실제 옵션 UI 컴포넌트. 필터 목록, 안내 섹션 및 **하이라이트 기본 활성화 여부와 같은 사용자 설정을 제공합니다.** |

## 렌더 트리

- `<main class="page">`: 기본 레이아웃 컨테이너.
- "Available filters" 카드: `AllFormFilter`, `TextFormFilter`, `MockFormFilter` 인스턴스를 순회하며 메타데이터(label, description)를 출력합니다.
- "How mirroring works" / "Permissions reminder" 섹션: 텍스트 기반 가이드를 제공합니다.

## 확장 포인트

- `filters` 배열에 새 `FormFilter` 인스턴스를 추가하면 옵션 페이지에 자동으로 표시됩니다.
- 사용자 설정 저장이 필요하다면 `shared/storage` 유틸리티를 가져와 폼 요소와 연결하세요.

## 스타일링

- 모든 시각 스타일은 `src/styles/globals.css`에 정의되어 있으며 공용 클래스(`page`, `card`, `info`)를 재사용합니다.
