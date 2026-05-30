export const THEME_STORAGE_KEY = 'practical-tracker-theme'
export const TRACKER_THEMES = ['dark', 'light']

export function isTheme(value) {
  return TRACKER_THEMES.includes(value)
}

export function getInitialTheme(storedTheme) {
  return isTheme(storedTheme) ? storedTheme : 'dark'
}

export function getNextTheme(theme) {
  return theme === 'light' ? 'dark' : 'light'
}
