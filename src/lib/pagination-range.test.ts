import { describe, expect, it } from 'vitest';
import { getPaginationRange } from './pagination-range';

describe('getPaginationRange', () => {
  it('returns all pages when total is small', () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('shows ellipsis when many pages', () => {
    expect(getPaginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
    expect(getPaginationRange(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
    expect(getPaginationRange(20, 20)).toEqual([1, 'ellipsis', 16, 17, 18, 19, 20]);
  });
});
