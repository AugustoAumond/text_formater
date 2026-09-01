export type ReplacementRule = {
  from: string
  to: string
}

export type PreviewPart = {
  text: string
  appliedRule?: AppliedReplacement
}

export type AppliedReplacement = ReplacementRule & {
  originalIdentifier: string
  transformedIdentifier: string
}

export type TransformPreview = {
  text: string
  parts: PreviewPart[]
}

const previewMarkerStart = '\uE000'
const previewMarkerEnd = '\uE001'

export function normalizeIdentifier(value: string): string {
  return value.trim().replace(/^0+(?=\d)/, '')
}

function compareNumericIdentifiers(first: string, second: string): number {
  const normalizedFirst = normalizeIdentifier(first)
  const normalizedSecond = normalizeIdentifier(second)

  if (normalizedFirst.length !== normalizedSecond.length) {
    return normalizedFirst.length - normalizedSecond.length
  }

  return normalizedFirst.localeCompare(normalizedSecond)
}

function getTrailingLineBreaks(value: string): string {
  return value.match(/(?:\r?\n[ \t]*)+$/)?.[0] ?? ''
}

/**
 * Sorts content sections marked by a standalone #number or #number# header.
 * Inline identifiers do not match this expression and remain in their paragraph.
 */
export function reorderSectionsByIdentifier(text: string): string {
  const headerExpression =
    /^[ \t]*#(\d+)#?(?:\uE000\d+\uE001)?[ \t]*(?:\r?\n|$)/gm
  const headers = Array.from(text.matchAll(headerExpression))

  if (headers.length < 2) {
    return text
  }

  const leadingContent = text.slice(0, headers[0].index)
  const sections = headers.map((header, index) => ({
    identifier: header[1],
    position: index,
    content: text.slice(
      header.index,
      headers[index + 1]?.index ?? text.length,
    ),
  }))
  const originalTrailingLineBreaks = getTrailingLineBreaks(text)
  const sectionSeparator =
    sections
      .map((section) => getTrailingLineBreaks(section.content))
      .find((lineBreaks) => lineBreaks) ?? '\n'

  const orderedSections = [...sections].sort((first, second) => {
    const comparison = compareNumericIdentifiers(
      first.identifier,
      second.identifier,
    )

    return comparison || first.position - second.position
  })

  const orderedContent = orderedSections
    .map((section) => {
      const lineBreaks = getTrailingLineBreaks(section.content)

      return lineBreaks
        ? section.content.slice(0, -lineBreaks.length)
        : section.content
    })
    .join(sectionSeparator)

  return leadingContent + orderedContent + originalTrailingLineBreaks
}

function buildPreview(
  textWithMarkers: string,
  appliedRules: AppliedReplacement[],
): TransformPreview {
  const previewParts: PreviewPart[] = []
  const appliedIdentifierExpression = /#(\d+)#\uE000(\d+)\uE001/g
  let lastIndex = 0

  for (const match of textWithMarkers.matchAll(appliedIdentifierExpression)) {
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      previewParts.push({ text: textWithMarkers.slice(lastIndex, matchIndex) })
    }

    previewParts.push({
      text: '#' + match[1] + '#',
      appliedRule: appliedRules[Number(match[2])],
    })
    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < textWithMarkers.length || previewParts.length === 0) {
    previewParts.push({ text: textWithMarkers.slice(lastIndex) })
  }

  return {
    text: previewParts.map((part) => part.text).join(''),
    parts: previewParts,
  }
}

/**
 * Applies every replacement in one pass over the original input text.
 * Identifiers already formatted as #number# are deliberately ignored.
 */
export function transformTextWithPreview(
  text: string,
  rules: ReplacementRule[],
): TransformPreview {
  const replacementBySource = new Map(
    rules.map(({ from, to }) => [
      normalizeIdentifier(from),
      { from: from.trim(), to: to.trim() },
    ]),
  )
  const appliedRules: AppliedReplacement[] = []

  const transformedText = text.replace(/#(\d+)(?![\d#])/g, (identifier, source: string) => {
    const replacement = replacementBySource.get(normalizeIdentifier(source))

    if (replacement === undefined) {
      return identifier
    }

    const transformedIdentifier = '#' + replacement.to + '#'
    const appliedRuleIndex =
      appliedRules.push({
        ...replacement,
        originalIdentifier: identifier,
        transformedIdentifier,
      }) - 1

    return (
      transformedIdentifier +
      previewMarkerStart +
      appliedRuleIndex +
      previewMarkerEnd
    )
  })

  return buildPreview(reorderSectionsByIdentifier(transformedText), appliedRules)
}

export function transformText(text: string, rules: ReplacementRule[]): string {
  return transformTextWithPreview(text, rules).text
}
