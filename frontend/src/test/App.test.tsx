import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Suppress wavesurfer.js AbortError during tests
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError') {
    event.preventDefault()
  }
})

describe('App Console Errors', () => {
  it('should not produce console errors on route navigation', async () => {
    const consoleErrors: string[] = []
    const originalError = console.error

    // Capture console.error calls
    console.error = (...args: unknown[]) => {
      const msg = args[0] as string
      if (typeof msg === 'string' && !msg.includes('Warning:')) {
        consoleErrors.push(msg)
      }
    }

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )

    // Wait for initial render
    await new Promise(r => setTimeout(r, 500))

    // Navigate to dashboard (should redirect to login since not authenticated)
    // Use MemoryRouter with proper routes
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    )

    await new Promise(r => setTimeout(r, 500))

    // Restore console.error
    console.error = originalError

    // Filter out React Router warnings that are not actual errors
    const realErrors = consoleErrors.filter(
      e => !e.includes('Warning:') && !e.includes('React DevTools')
    )

    expect(realErrors).toHaveLength(0)
  })
})
