import { replaceSourceRange, type Segment } from 'muggle-string'

export * from 'muggle-string'

export function replaceRange<T extends Segment<any>>(
  segments: T[],
  startOffset: number,
  endOffset: number,
  ...newSegments: T[]
) {
  return replaceSourceRange(
    segments,
    undefined,
    startOffset,
    endOffset,
    ...newSegments,
  )
}
