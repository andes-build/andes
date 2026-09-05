/** The file names the Files screen opens as an editable document (spec 024).
 *  Anything else stays read-only: it is shown as it is shown today and never
 *  offers editing (criterion 6). */
const EDITABLE_MARKDOWN_EXTENSIONS = ['.md', '.markdown'] as const

export function isEditableMarkdownFileName(fileName: string): boolean {
  const lowerCased = fileName.toLowerCase()
  return EDITABLE_MARKDOWN_EXTENSIONS.some((extension) => lowerCased.endsWith(extension))
}
