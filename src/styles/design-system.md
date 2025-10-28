# Spicy Mask 디자인 시스템

## 1. 철학

Spicy Mask의 디자인 시스템은 **신뢰성**, **명확성**, **통일성**을 목표로 합니다. 사용자가 웹 브라우징 중 마주치는 다양한 상황(안전, 경고, 위험)을 직관적으로 인지할 수 있도록 돕고, 모든 UI 요소에서 일관된 경험을 제공합니다.

다크 네이비 계열의 차분한 기본 색상 위에 상황에 맞는 3가지 액센트 색상(Green, Orange, Red)을 동적으로 사용하여 명확한 정보 전달과 시각적 안정감을 동시에 추구합니다.

## 2. 색상 팔레트 (Color Palette)

모든 색상은 CSS 변수로 정의하여 재사용성과 유지보수성을 높입니다.

### 2.1. 기본 색상 (Base Colors) - Dark Navy Theme

| 변수명                         | 색상 (Hex)                                                         | 설명                            |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------------- |
| `--color-background-primary`   | ![#1A202C](https://placehold.co/15x15/1A202C/1A202C.png) `#1A202C` | 가장 어두운 기본 배경색 (차콜)  |
| `--color-background-secondary` | ![#2D3748](https://placehold.co/15x15/2D3748/2D3748.png) `#2D3748` | 카드, 패널 등 구분되는 배경색   |
| `--color-border`               | ![#4A5568](https://placehold.co/15x15/4A5568/4A5568.png) `#4A5568` | 경계선, 구분선 색상             |
| `--color-text-primary`         | ![#F7FAFC](https://placehold.co/15x15/F7FAFC/F7FAFC.png) `#F7FAFC` | 기본 텍스트 색상 (밝은 회색)    |
| `--color-text-secondary`       | ![#A0AEC0](https://placehold.co/15x15/A0AEC0/A0AEC0.png) `#A0AEC0` | 보조, 비활성 텍스트 색상 (회색) |
| `--color-text-link`            | ![#63B3ED](https://placehold.co/15x15/63B3ED/63B3ED.png) `#63B3ED` | 링크 텍스트 색상 (밝은 파랑)    |

### 2.2. 액센트 색상 (Accent Colors)

로고 및 상태 표시에 사용되는 동적 색상입니다.

| 변수명                  | 색상 (Hex)                                                         | 설명                                                       |
| ----------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `--color-accent-green`  | ![#48BB78](https://placehold.co/15x15/48BB78/48BB78.png) `#48BB78` | **안전(Safe)**, 성공, 허용 상태를 나타냅니다.              |
| `--color-accent-orange` | ![#ED8936](https://placehold.co/15x15/ED8936/ED8936.png) `#ED8936` | **경고(Warning)**, 주의가 필요한 상태입니다.               |
| `--color-accent-red`    | ![#F56565](https://placehold.co/15x15/F56565/F56565.png) `#F56565` | **위험(Danger)**, 오류, 즉각적인 조치가 필요한 상태입니다. |

### 2.3. 하이라이트 및 특수 색상 (Highlight & Special Colors)

| 변수명                         | 색상 (Hex)                                                         | 설명                                                                  |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `--color-highlight-background` | ![#FBBF24](https://placehold.co/15x15/FBBF24/FBBF24.png) `#FBBF24` | 텍스트 내에서 감지된 특정 항목(예: PII)을 강조하기 위한 배경색입니다. |

## 3. 타이포그래피 (Typography)

### 3.1. 글꼴 (Font Family)

크로스 플랫폼 호환성을 위해 시스템 기본 글꼴을 사용합니다.

```css
--font-family-base:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
  sans-serif;
```

### 3.2. 글꼴 크기 (Font Sizes)

| 변수명           | 크기 (px) | 사용처 예시         |
| ---------------- | --------- | ------------------- |
| `--font-size-xs` | 12px      | 작은 주석, 캡션     |
| `--font-size-sm` | 14px      | 본문, 기본 텍스트   |
| `--font-size-md` | 16px      | 소제목, 강조 텍스트 |
| `--font-size-lg` | 18px      | 중간 제목           |
| `--font-size-xl` | 24px      | 페이지, 섹션 제목   |

### 3.3. 글꼴 두께 (Font Weights)

| 변수명                 | 값  | 설명      |
| ---------------------- | --- | --------- |
| `--font-weight-normal` | 400 | 기본 두께 |
| `--font-weight-medium` | 500 | 중간 두께 |
| `--font-weight-bold`   | 700 | 굵은 두께 |

## 4. 간격 및 크기 (Spacing & Sizing)

`1rem = 16px` 기준의 일관된 간격 시스템을 사용합니다.

| 변수명        | 값 (rem) | 값 (px) |
| ------------- | -------- | ------- |
| `--spacing-1` | 0.25rem  | 4px     |
| `--spacing-2` | 0.5rem   | 8px     |
| `--spacing-3` | 0.75rem  | 12px    |
| `--spacing-4` | 1rem     | 16px    |
| `--spacing-6` | 1.5rem   | 24px    |
| `--spacing-8` | 2rem     | 32px    |

## 5. 컴포넌트 스타일 (Component Styles)

### 5.1. 버튼 (Buttons)

- **Primary Button**: 주요 액션 버튼. 배경은 액센트 색상(`green`, `orange`, `red`) 중 하나를 사용하고, 텍스트는 `--color-text-primary`를 사용합니다.
- **Secondary Button**: 보조 액션 버튼. 배경은 `--color-background-secondary`, 텍스트는 `--color-text-primary`, 테두리는 `--color-border`를 사용합니다.
- **Ghost Button**: 배경 없이 텍스트와 아이콘만 있는 버튼. 텍스트 색상은 `--color-text-secondary`를 사용하며, hover 시 `--color-text-primary`로 변경됩니다.

### 5.2. 카드 및 패널 (Cards & Panels)

- `background-color`: `--color-background-secondary`
- `border`: `1px solid var(--color-border)`
- `border-radius`: `8px`
- `padding`: `var(--spacing-4)`
- `box-shadow`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`

### 5.3. 입력 필드 (Input Fields)

- `background-color`: `--color-background-primary`
- `border`: `1px solid var(--color-border)`
- `border-radius`: `4px`
- `color`: `var(--color-text-primary)`
- `padding`: `var(--spacing-2) var(--spacing-3)`
- `focus` 상태: 테두리 색상을 `--color-text-link`로 변경합니다.

### 5.4. 팝오버 및 배너 (Popovers & Banners)

- **팝오버 (PII 관리 패널 등)**: 기본 스타일은 카드를 따르며, 제목 영역에는 액센트 색상을 활용하여 상태를 표현할 수 있습니다.
- **경고 배너 (피싱 경고 등)**: 각 상태에 맞는 액센트 색상(`--color-accent-orange`, `--color-accent-red`)을 배경으로 사용하여 사용자의 즉각적인 주의를 유도합니다.

---

이 디자인 시스템을 바탕으로 UI 요소들을 수정하는 작업을 진행하겠습니다.
