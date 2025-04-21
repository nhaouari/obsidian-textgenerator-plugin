import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A utility function to create a memoized component with performance tracking
 * This helps identify components that are rendering too frequently
 */
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  name: string,
  customCompare?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) {
  // In development, we can track component render frequency
  if (process.env.NODE_ENV === 'development') {
    const MemoizedComponent = React.memo(
      (props: P) => {
        const renderCount = React.useRef(0)
        renderCount.current += 1

        // Log excessive renders to help identify problematic components
        if (renderCount.current > 5) {
          console.warn(`Component ${name} has rendered ${renderCount.current} times. Consider reviewing its usage.`)
        }

        return React.createElement(Component, props)
      },
      customCompare
    )

    MemoizedComponent.displayName = `Memoized(${name})`
    return MemoizedComponent
  }

  // In production, just use memo without the tracking overhead
  const MemoizedComponent = React.memo(Component, customCompare)
  MemoizedComponent.displayName = `Memoized(${name})`
  return MemoizedComponent
}

/**
 * A utility function to defer expensive operations outside the critical rendering path
 */
export function deferOperation<T>(operation: () => T, callback: (result: T) => void) {
  setTimeout(() => {
    const result = operation()
    callback(result)
  }, 0)
}

/**
 * A hook to debounce expensive operations that might be triggered by events
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * A hook to prevent event handlers from running too frequently
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  const lastCallTimeRef = React.useRef<number>(0)

  return React.useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()

      if (now - lastCallTimeRef.current >= delay) {
        lastCallTimeRef.current = now
        callback(...args)
      }
    },
    [callback, delay]
  )
}
