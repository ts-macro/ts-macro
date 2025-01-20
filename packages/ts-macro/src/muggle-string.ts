import {
  create,
  getLength,
  getStack,
  offsetStack,
  replace,
  replaceAll,
  replaceSourceRange,
  resetOffsetStack,
  setTracking,
  toString,
  track,
  type Segment,
  type StackNode,
} from 'muggle-string'

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

export {
  create,
  getLength,
  getStack,
  offsetStack,
  replace,
  replaceAll,
  resetOffsetStack,
  setTracking,
  toString,
  track,
  type Segment,
  type StackNode,
}
