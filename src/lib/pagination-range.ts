export type PageToken = number | 'ellipsis';

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

/**
 * Build a compact page list with ellipsis, e.g. [1, 'ellipsis', 4, 5, 6, 'ellipsis', 20]
 */
export function getPaginationRange(
  current: number,
  total: number,
  siblingCount = 1
): PageToken[] {
  if (total <= 1) return total === 1 ? [1] : [];

  const safeCurrent = Math.min(Math.max(current, 1), total);
  // first + last + current + 2*siblings + 2 ellipsis
  const maxVisible = siblingCount * 2 + 5;

  if (total <= maxVisible) {
    return range(1, total);
  }

  const leftSibling = Math.max(safeCurrent - siblingCount, 1);
  const rightSibling = Math.min(safeCurrent + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    return [...range(1, leftItemCount), 'ellipsis', total];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    return [1, 'ellipsis', ...range(total - rightItemCount + 1, total)];
  }

  return [1, 'ellipsis', ...range(leftSibling, rightSibling), 'ellipsis', total];
}
