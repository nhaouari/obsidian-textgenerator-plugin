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

/**
 * Performance tracking utility to help identify bottlenecks
 */
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private timings: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(log = false): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  start(label: string) {
    this.startTimes.set(label, performance.now());
  }

  end(label: string, log = false) {
    const startTime = this.startTimes.get(label);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    const timings = this.timings.get(label) || [];
    timings.push(duration);
    this.timings.set(label, timings);
    this.startTimes.delete(label);
    
    if (log) {
      console.log(`[TG:Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
  }

  getAverage(label: string): number {
    const timings = this.timings.get(label);
    if (!timings || timings.length === 0) return 0;
    return timings.reduce((a, b) => a + b, 0) / timings.length;
  }

  getSlowestOperations(count = 5): { label: string; average: number }[] {
    const operations = Array.from(this.timings.entries())
      .map(([label, timings]) => ({
        label,
        average: timings.reduce((a, b) => a + b, 0) / timings.length,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, count);

    console.log('\n[TG:Performance] Top 5 Slowest Operations:');
    operations.forEach((op, i) => {
      console.log(`${i + 1}. ${op.label}: ${op.average.toFixed(2)}ms avg`);
    });
    console.log('');

    return operations;
  }
}
