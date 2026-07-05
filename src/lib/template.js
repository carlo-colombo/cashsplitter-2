const templateCache = new Map()

export function setTemplate(name, content) {
  templateCache.set(name, content)
}

export function render(name, data) {
  const template = templateCache.get(name)
  if (!template) return ''
  return parseTemplate(template, data)
}

function parseTemplate(template, data) {
  template = template.replace(/\{\{![\s\S]*?\}\}/g, '')
  let result = ''
  let i = 0
  while (i < template.length) {
    const openIdx = template.indexOf('{{', i)
    if (openIdx === -1) {
      result += template.slice(i)
      break
    }
    result += template.slice(i, openIdx)
    const isRaw = template.charAt(openIdx + 2) === '{'
    const tagStart = openIdx + (isRaw ? 3 : 2)
    const closeTag = isRaw ? '}}}' : '}}'
    const closeIdx = template.indexOf(closeTag, tagStart)
    if (closeIdx === -1) {
      result += template.slice(openIdx)
      break
    }
    const tag = template.slice(tagStart, closeIdx).trim()
    const afterClose = closeIdx + closeTag.length
    if (tag.startsWith('#each ')) {
      const listKey = tag.slice(6).trim()
      const blockEnd = findBlockEnd(template, afterClose)
      if (blockEnd === -1) break
      const innerTemplate = template.slice(afterClose, blockEnd)
      const endTagEnd = template.indexOf('}}', blockEnd)
      if (endTagEnd === -1) break
      const list = resolvePath(data, listKey)
      if (Array.isArray(list)) {
        for (const item of list) {
          result += parseTemplate(innerTemplate, { ...data, this: item })
        }
      }
      i = endTagEnd + 2
    } else if (tag.startsWith('#if ')) {
      const condKey = tag.slice(4).trim()
      const blockEnd = findBlockEnd(template, afterClose)
      if (blockEnd === -1) break
      const ifContent = template.slice(afterClose, blockEnd)
      const elseIdx = findElseAtDepthZero(ifContent)
      let trueTemplate, falseTemplate
      if (elseIdx !== -1) {
        trueTemplate = ifContent.slice(0, elseIdx)
        falseTemplate = ifContent.slice(elseIdx + 8)
      } else {
        trueTemplate = ifContent
        falseTemplate = ''
      }
      const endTagEnd = template.indexOf('}}', blockEnd)
      if (endTagEnd === -1) break
      const condition = resolvePath(data, condKey)
      if (condition) {
        result += parseTemplate(trueTemplate, data)
      } else {
        result += parseTemplate(falseTemplate, data)
      }
      i = endTagEnd + 2
    } else if (tag.startsWith('/') || tag === 'else') {
      i = afterClose
    } else {
      const value = resolvePath(data, tag)
      const str = value == null ? '' : String(value)
      result += isRaw ? str : escapeHtml(str)
      i = afterClose
    }
  }
  return result
}

function findBlockEnd(template, startPos) {
  let depth = 0
  let i = startPos
  while (i < template.length) {
    const openIdx = template.indexOf('{{#', i)
    const closeIdx = template.indexOf('{{/', i)
    if (closeIdx === -1) return -1
    if (openIdx !== -1 && openIdx < closeIdx) {
      depth++
      i = openIdx + 3
    } else {
      if (depth === 0) return closeIdx
      depth--
      i = closeIdx + 3
    }
  }
  return -1
}

function findElseAtDepthZero(template) {
  let depth = 0
  let i = 0
  while (i < template.length) {
    const openIdx = template.indexOf('{{#', i)
    const closeIdx = template.indexOf('{{/', i)
    const elseIdx = template.indexOf('{{else}}', i)
    if (elseIdx === -1 && openIdx === -1 && closeIdx === -1) return -1
    let earliest = Infinity
    let type = ''
    if (openIdx !== -1 && openIdx < earliest) { earliest = openIdx; type = 'open' }
    if (closeIdx !== -1 && closeIdx < earliest) { earliest = closeIdx; type = 'close' }
    if (elseIdx !== -1 && elseIdx < earliest) { earliest = elseIdx; type = 'else' }
    if (type === 'else' && depth === 0) return earliest
    if (type === 'open') { depth++; i = earliest + 3 }
    else if (type === 'close') { depth--; i = earliest + 3 }
    else { i = earliest + 8 }
  }
  return -1
}

function resolvePath(obj, path) {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null) return ''
    current = current[part]
  }
  return current == null ? '' : current
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
