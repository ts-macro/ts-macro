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
import type { Code, CodeWithoutSource } from './types'

export function replaceRange(
  segments: Code[],
  startOffset: number,
  endOffset: number,
  ...newSegments: CodeWithoutSource[]
) {
  return replaceSourceRange(
    segments,
    undefined,
    startOffset,
    endOffset,
    ...newSegments.map((i: any) => {
      if (Array.isArray(i) && typeof i[1] === 'number') {
        i.splice(1, 0, undefined)
      }
      return i
    }),
  )
}

export {
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
}
