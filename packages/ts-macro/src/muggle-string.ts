import {
  replaceSourceRange as _replaceSourceRange,
  create,
  getLength,
  replace,
  replaceAll,
  toString,
  type Segment,
} from 'muggle-string'
import type { Code, Codes, CodeWithoutSource } from './types'

export function replaceRange(
  segments: Code[],
  startOffset: number,
  endOffset: number,
  ...newSegments: CodeWithoutSource[]
) {
  return _replaceSourceRange(
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

export function replaceSourceRange(
  segments: Code[],
  source: string | undefined,
  startOffset: number,
  endOffset: number,
  ...newSegments: CodeWithoutSource[]
) {
  return _replaceSourceRange(
    segments,
    source,
    startOffset,
    endOffset,
    ...newSegments.map((i: any) => {
      if (Array.isArray(i) && typeof i[1] === 'number') {
        i.splice(1, 0, source)
      }
      return i
    }),
  )
}

export function codesProxyHandler(codes: Code[]) {
  return new Proxy(codes, {
    get: (target, p, receiver) => {
      if (p === 'replaceRange') {
        return (
          startOffset: number,
          endOffset: number,
          ...newSegments: CodeWithoutSource[]
        ) => {
          return replaceRange(codes, startOffset, endOffset, ...newSegments)
        }
      } else if (p === 'replaceSourceRange') {
        return (
          source: string | undefined,
          startOffset: number,
          endOffset: number,
          ...newSegments: CodeWithoutSource[]
        ) => {
          return replaceSourceRange(
            codes,
            source,
            startOffset,
            endOffset,
            ...(newSegments as any),
          )
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
        ) => replaceAll(codes, pattern as RegExp, ...replacers)
      } else if (p === 'toString') {
        return () => toString(codes)
      } else if (p === 'getLength') {
        return () => getLength(codes)
      }

      return Reflect.get(target, p, receiver)
    },
  }) as Codes
}

export { create, getLength, replace, replaceAll, toString, type Segment }
