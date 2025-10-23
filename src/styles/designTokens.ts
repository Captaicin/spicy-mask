/**
 * Spicy Mask Design System Tokens
 *
 * 이 파일은 디자인 시스템의 값들을 자바스크립트 상수로 정의합니다.
 * 모든 UI 컴포넌트의 인라인 스타일에서 이 값들을 참조하여 일관성을 유지합니다.
 */

export const colors = {
  // Base Colors
  backgroundPrimary: '#1A202C',
  backgroundSecondary: '#2D3748',
  border: '#4A5568',
  textPrimary: '#F7FAFC',
  textSecondary: '#A0AEC0',
  textLink: '#63B3ED',

  // Accent Colors
  accentGreen: '#48BB78',
  accentOrange: '#ED8936',
  accentRed: '#F56565',

  // Highlight & Special Colors
  highlightBackground: 'rgba(252, 211, 77, 0.6)',
}

export const spacing = {
  s1: '4px',
  s2: '8px',
  s3: '12px',
  s4: '16px',
  s6: '24px',
  s8: '32px',
}

export const typography = {
  fontFamilyBase:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSizeXXs: '10px',
  fontSizeXs: '12px',
  fontSizeSm: '14px',
  fontSizeMd: '16px',
  fontSizeLg: '18px',
  fontSizeXl: '24px',
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
}

export const radii = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px',
}

export const shadows = {
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
}
