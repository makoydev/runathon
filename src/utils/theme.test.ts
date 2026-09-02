import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadThemePreference,
  storeThemePreference,
  resolveTheme,
  applyTheme,
} from './theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to the system preference', () => {
    expect(loadThemePreference()).toBe('system')
  })

  it('stores explicit preferences and clears the stored value for system', () => {
    storeThemePreference('dark')
    expect(loadThemePreference()).toBe('dark')

    storeThemePreference('system')
    expect(loadThemePreference()).toBe('system')
    expect(localStorage.getItem('runathon.theme.v1')).toBeNull()
  })

  it('ignores garbage in storage', () => {
    localStorage.setItem('runathon.theme.v1', 'sepia')
    expect(loadThemePreference()).toBe('system')
  })

  it('resolves explicit preferences directly', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('resolves system from the media query', () => {
    const matchMedia = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValue({ matches: true } as MediaQueryList)
    expect(resolveTheme('system')).toBe('dark')

    matchMedia.mockReturnValue({ matches: false } as MediaQueryList)
    expect(resolveTheme('system')).toBe('light')
    matchMedia.mockRestore()
  })

  it('applies and removes the dark class on the document root', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
