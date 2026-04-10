import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility function', () => {
  it('should merge simple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes with objects', () => {
    expect(cn({ 'class1': true, 'class2': false, 'class3': true })).toBe('class1 class3');
  });

  it('should merge classes from arrays', () => {
    expect(cn(['class1', 'class2'], ['class3'])).toBe('class1 class2 class3');
  });

  it('should ignore falsy values gracefully', () => {
    // clsx handles undefined, null, false, 0, "" as ignored
    expect(cn('class1', null, undefined, false, 0, '', 'class2')).toBe('class1 class2');
  });

  it('should resolve Tailwind CSS conflicts using twMerge', () => {
    expect(cn('p-2 p-4')).toBe('p-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('flex', 'inline-flex')).toBe('inline-flex');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('should correctly mix strings, objects, arrays, and falsy values while resolving conflicts', () => {
    const isHovered = true;
    const isActive = false;
    expect(
      cn(
        'base-class',
        ['array-class1', 'array-class2'],
        {
          'hover-class': isHovered,
          'active-class': isActive,
        },
        null,
        'p-2', // will be overridden
        'p-4'
      )
    ).toBe('base-class array-class1 array-class2 hover-class p-4');
  });
});
