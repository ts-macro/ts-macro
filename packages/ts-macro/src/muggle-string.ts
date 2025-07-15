import * as ms from 'muggle-string'
import { allCodeFeatures } from './virtual-code'
import type { Code, CodeInformation, Codes } from './types'
import type { Segment } from 'muggle-string'

export const resolveSegment = (segment: Code, source?: string) => {
  if (Array.isArray(segment)) {
    if (typeof segment[1] === 'number') {
      segment.splice(1, 0, source)
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
    ...newSegments.map((code) => resolveSegment(code)),
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
    ...newSegments.map((code) => resolveSegment(code, source)),
  )
}

export function toString(segments: Code[]) {
  return ms.toString(segments as Segment<CodeInformation>[])
}

export function getLength(segments: Code[]) {
  return ms.getLength(segments as Segment<CodeInformation>[])
}

export function replace(
  segments: Code[],
  pattern: string | RegExp,
  ...replacers: (Code | ((match: string) => Segment<CodeInformation>))[]
) {
  return ms.replace(
    segments as Segment<CodeInformation>[],
    pattern,
    ...replacers.map((code) =>
      typeof code === 'function' ? code : resolveSegment(code),
    ),
  )
}

export function replaceAll(
  segments: Code[],
  pattern: string | RegExp,
  ...replacers: (Code | ((match: string) => Segment<CodeInformation>))[]
) {
  return ms.replaceAll(
    segments as Segment<CodeInformation>[],
    pattern as RegExp,
    ...replacers.map((code) =>
      typeof code === 'function' ? code : resolveSegment(code),
    ),
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
          ...replacers: (Code | ((match: string) => Segment<CodeInformation>))[]
        ) => replace(codes, pattern, ...replacers)
      } else if (p === 'replaceAll') {
        return (
          pattern: string | RegExp,
          ...replacers: (Code | ((match: string) => Segment<CodeInformation>))[]
        ) => replaceAll(codes, pattern, ...replacers)
      } else if (p === 'toString') {
        return () => toString(codes)
      } else if (p === 'getLength') {
        return () => getLength(codes)
      } else if (['push', 'unshift'].includes(p as string)) {
        return (...args: Code[]) =>
          codes.push(...args.map((code) => resolveSegment(code, source)))
      } else if (p === 'splice') {
        return (start: number, deleteCount: number, ...args: Code[]) =>
          codes.splice(
            start,
            deleteCount,
            ...args.map((code) => resolveSegment(code, source)),
          )
      }

      return Reflect.get(target, p, receiver)
    },
  }) as Codes
}

export { type Segment }
