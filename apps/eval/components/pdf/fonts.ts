import { Font } from '@react-pdf/renderer'

let registered = false

export function registerKoreanFont() {
  if (registered) return
  Font.register({
    family: 'Pretendard',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Regular.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Bold.ttf',
        fontWeight: 700,
      },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
  registered = true
}
