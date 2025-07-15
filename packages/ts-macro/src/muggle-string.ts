import * as ms from 'muggle-string'
import { allCodeFeatures } from './virtual-code'
import type { Code, CodeInformation, Codes } from './types'
import type { Segment } from 'muggle-string'

export const resolveSegment = (segment: Code) => {
  if (Array.isArray(segment)) {
    if (typeof segment[1] === 'number') {
      segment.splice(1, 0, undefined)
    }
    if (typeof segment.at(-1) !== 'object') {
      segment.push(allCodeFeatures)
    }
  }
  return segment as Segment<CodeInformation>
}

export function replaceRange(
  segments: Code[],
  startOffset: number,
  endOffset: number,
  ...newSegments: Code[]
) {
  return ms.replaceSourceRange(
    segments as Segment<CodeInformation>[],
    undefined,
    startOffset,
    endOffset,
    ...newSegments.map(resolveSegment),
  )
}

export function replaceSourceRange(
  segments: Code[],
  source: string | undefined,
  startOffset: number,
  endOffset: number,
  ...newSegments: Code[]
) {
  return ms.replaceSourceRange(
    segments as Segment<CodeInformation>[],
    source,
    startOffset,
    endOffset,
    ...newSegments.map(resolveSegment),
  )
}

export function toString(segments: Code[]) {
  return ms.toString(segments.map(resolveSegment))
}

export function getLength(segments: Code[]) {
  return ms.getLength(segments.map(resolveSegment))
}

export function replace(
  segments: Code[],
  pattern: string | RegExp,
  ...replacers: (Code | ((match: string) => Code))[]
) {
  return ms.replace(
    segments.map(resolveSegment),
    pattern,
    ...(replacers as any),
  )
}

export function replaceAll(
  segments: Code[],
  pattern: string | RegExp,
  ...replacers: (Code | ((match: string) => Code))[]
) {
  return ms.replaceAll(
    segments.map(resolveSegment),
    pattern as RegExp,
    ...(replacers as any),
  )
}

export function codesProxyHandler(codes: Code[], source?: string) {
  return new Proxy(codes, {
    get: (target, p, receiver) => {
      if (p === 'replaceRange') {
        return (
          startOffset: number,
          endOffset: number,
          ...newSegments: Code[]
        ) => {
          if (source) {
            return replaceSourceRange(
              codes,
              source,
              startOffset,
              endOffset,
              ...newSegments,
            )
          }
          return replaceRange(codes, startOffset, endOffset, ...newSegments)
        }
      } else if (p === 'replace') {
        return (
          pattern: string | RegExp,
          ...replacers: (Code | ((match: string) => Code))[]
        ) => replace(codes, pattern, ...replacers)
      } else if (p === 'replaceAll') {
        return (
          pattern: string | RegExp,
          ...replacers: (Code | ((match: string) => Code))[]
        ) => replaceAll(codes, pattern, ...replacers)
      } else if (p === 'toString') {
        return () => toString(codes)
      } else if (p === 'getLength') {
        return () => getLength(codes)
      }

      return Reflect.get(target, p, receiver)
    },
  }) as Codes
}

export { type Segment }
