import { renderHook, act } from '@testing-library/react';
import { useSmoothStream } from './useSmoothStream';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useSmoothStream', () => {
  let originalHardwareConcurrency: number | undefined;
  let originalDeviceMemory: number | undefined;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock requestAnimationFrame and cancelAnimationFrame
    let idCounter = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = ++idCounter;
      setTimeout(() => cb(performance.now()), 40);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      clearTimeout(id);
    });

    // Save original navigator properties
    originalHardwareConcurrency = navigator.hardwareConcurrency;
    originalDeviceMemory = (navigator as any).deviceMemory;

    // Default to high-end device to test animations
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
    Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();

    // Restore original navigator properties
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: originalHardwareConcurrency, configurable: true });
    Object.defineProperty(navigator, 'deviceMemory', { value: originalDeviceMemory, configurable: true });
  });

  it('should render initial content immediately if empty or short', () => {
    const { result } = renderHook(() => useSmoothStream('Hello', 'normal', true));
    expect(result.current).toBe('Hello');
  });

  it('should stream content gradually on high-end device when enabled', () => {
    // 40ms interval, 6 chars per tick for 'normal' speed
    const content = 'This is a long message that should be streamed smoothly over time.';

    // We expect it to initially just have the content (due to how it updates if same length or similar)
    // Actually the hook sets initial state to content. But let's test content change.

    const { result, rerender } = renderHook(
      ({ text, speed, enabled }) => useSmoothStream(text, speed as any, enabled),
      { initialProps: { text: '', speed: 'normal', enabled: true } }
    );

    expect(result.current).toBe('');

    // Update with new content
    rerender({ text: content, speed: 'normal', enabled: true });

    // Initially after re-render it should be empty (starts animation)
    expect(result.current).toBe('');

    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(result.current).toBe('This i'); // 6 chars

    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(result.current).toBe('This is a lo'); // 12 chars
  });

  it('should stream faster when speed is "fast"', () => {
    const content = 'This is a long message that should be streamed smoothly over time.';

    const { result, rerender } = renderHook(
      ({ text, speed, enabled }) => useSmoothStream(text, speed as any, enabled),
      { initialProps: { text: '', speed: 'fast', enabled: true } }
    );

    rerender({ text: content, speed: 'fast', enabled: true });

    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(result.current).toBe('This is a lo'); // 12 chars for 'fast'
  });

  it('should stream slower when speed is "slow"', () => {
    const content = 'This is a long message that should be streamed smoothly over time.';

    const { result, rerender } = renderHook(
      ({ text, speed, enabled }) => useSmoothStream(text, speed as any, enabled),
      { initialProps: { text: '', speed: 'slow', enabled: true } }
    );

    rerender({ text: content, speed: 'slow', enabled: true });

    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(result.current).toBe('Thi'); // 3 chars for 'slow'
  });

  it('should not animate if disabled', () => {
    const content = 'This is a long message that should be streamed smoothly over time.';

    const { result, rerender } = renderHook(
      ({ text, speed, enabled }) => useSmoothStream(text, speed as any, enabled),
      { initialProps: { text: '', speed: 'normal', enabled: false } }
    );

    rerender({ text: content, speed: 'normal', enabled: false });

    // Should immediately show full content without animation
    expect(result.current).toBe(content);
  });

  it('should not animate on low-end devices (hardwareConcurrency <= 4)', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });
    Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });

    const content = 'This is a long message that should be streamed smoothly over time.';

    const { result, rerender } = renderHook(
      ({ text, speed, enabled }) => useSmoothStream(text, speed as any, enabled),
      { initialProps: { text: '', speed: 'normal', enabled: true } }
    );

    rerender({ text: content, speed: 'normal', enabled: true });

    // Should immediately show full content without animation
    expect(result.current).toBe(content);
  });

  it('should not animate on low-end devices (deviceMemory <= 4)', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });

    const content = 'This is a long message that should be streamed smoothly over time.';

    const { result, rerender } = renderHook(
      ({ text, speed, enabled }) => useSmoothStream(text, speed as any, enabled),
      { initialProps: { text: '', speed: 'normal', enabled: true } }
    );

    rerender({ text: content, speed: 'normal', enabled: true });

    // Should immediately show full content without animation
    expect(result.current).toBe(content);
  });

  it('should handle completely replaced content (not appending)', () => {
    const { result, rerender } = renderHook(
      ({ text, speed, enabled }) => useSmoothStream(text, speed as any, enabled),
      { initialProps: { text: 'Hello', speed: 'normal', enabled: true } }
    );

    expect(result.current).toBe('Hello');

    // Completely new content (doesn't start with 'Hello')
    rerender({ text: 'World', speed: 'normal', enabled: true });

    // Should immediately update to 'World' because it's a reset
    expect(result.current).toBe('World');
  });

  it('should cleanup animation frame on unmount', () => {
    const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');

    const { unmount } = renderHook(() => useSmoothStream('Test content', 'normal', true));

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
