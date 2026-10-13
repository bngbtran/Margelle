import type { CSSProperties } from 'react'

export const DEFAULT_COVER = '#a9522d'

export const COVER_PRESETS: { name: string; value: string }[] = [
  { name: 'Đất nung', value: DEFAULT_COVER },
  { name: 'Đỏ rượu', value: '#7a1f2b' },
  { name: 'Hồng đất', value: '#c06c84' },
  { name: 'Mận', value: '#6b2f55' },
  { name: 'Oải hương', value: '#7a6aa8' },
  { name: 'Chàm', value: '#2b3964' },
  { name: 'Xanh trời', value: '#3b78a8' },
  { name: 'Nước giếng', value: '#1d5966' },
  { name: 'Ngọc lam', value: '#0f6b6b' },
  { name: 'Rừng', value: '#1f4d3a' },
  { name: 'Rêu', value: '#33603f' },
  { name: 'Ô liu', value: '#6b6b2a' },
  { name: 'Hoàng thổ', value: '#a17c2a' },
  { name: 'Cát', value: '#d8c3a0' },
  { name: 'Kem', value: '#efe6d2' },
  { name: 'Đá', value: '#4a5560' },
  { name: 'Mực nâu', value: '#3c2c22' },
  { name: 'Than', value: '#26282b' },
]

// Colour names stored by the first version of playlists.
const LEGACY_NAMES: Record<string, string> = {
  terracotta: DEFAULT_COVER,
  ink: '#3c2c22',
  moss: '#33603f',
  well: '#1d5966',
  plum: '#6b2f55',
  ochre: '#a17c2a',
  navy: '#2b3964',
}

const HEX = /^#[0-9a-f]{6}$/i

export function isHexColor(value: string) {
  return HEX.test(value)
}

export function coverHex(color: string): string {
  if (isHexColor(color)) return color.toLowerCase()
  return LEGACY_NAMES[color] ?? DEFAULT_COVER
}

function isLight(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.36
}

// Sets the cover colour and a lettering colour that stays readable on it.
export function coverStyle(color: string): CSSProperties {
  const hex = coverHex(color)
  return {
    '--cover': hex,
    '--cover-ink': isLight(hex) ? '#2b211a' : '#f7efdf',
  } as CSSProperties
}
