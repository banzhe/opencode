const urlPattern = /^https?:\/\/[^\s<>()`"']+$/
const lineInfoRe = /(?::(\d+)(?::(\d+))?|:(\d+)-(\d+))$/

type FilePathInfo = {
  path: string
  line?: number
  endLine?: number
}

function codeUrl(text: string) {
  const href = text.trim().replace(/[),.;!?]+$/, "")
  if (!urlPattern.test(href)) return
  try {
    const url = new URL(href)
    return url.toString()
  } catch {
    return
  }
}

function parseFilePath(raw: string, workspace?: string): FilePathInfo | undefined {
  let text = raw.replace(/[),.;!?]+$/, "")
  if (!text) return
  if (/^(https?:|ftp:|mailto:|tel:|data:)/i.test(text)) return

  let line: number | undefined
  let endLine: number | undefined
  const lineMatch = text.match(lineInfoRe)
  if (lineMatch) {
    text = text.slice(0, text.length - lineMatch[0].length)
    if (lineMatch[3]) {
      line = parseInt(lineMatch[3], 10)
      endLine = parseInt(lineMatch[4], 10)
    } else if (lineMatch[1]) {
      line = parseInt(lineMatch[1], 10)
      endLine = lineMatch[2] ? parseInt(lineMatch[2], 10) : undefined
    }
  }

  if (/^[A-Za-z]:/.test(text)) {
    text = text.replace(/\\/g, "/")
  }

  if (!text.includes("/")) return
  if (/^\/\/[^/]/.test(text)) return

  if (!/^\//.test(text) && !/^[A-Za-z]:/.test(text) && text.includes("/")) {
    if (workspace) {
      text = workspace.replace(/[\\/]+$/, "") + "/" + text.replace(/^\.\//, "")
    }
  }

  const hasExtension = /\.[A-Za-z0-9]{1,10}$/.test(text)
  if (!hasExtension && !/^\//.test(text) && !/^[A-Za-z]:/.test(text)) return

  return { path: text, line, endLine }
}

function encodeFilePath(filepath: string): string {
  let normalized = filepath.replace(/\\/g, "/")
  if (/^[A-Za-z]:/.test(normalized)) {
    normalized = "/" + normalized
  }
  return normalized
    .split("/")
    .map((segment, idx) => {
      if (idx === 1 && /^[A-Za-z]:$/.test(segment)) return segment
      return encodeURIComponent(segment)
    })
    .join("/")
}

function markCodeFileLinks(root: HTMLDivElement, workspace?: string) {
  const codeNodes = Array.from(root.querySelectorAll(":not(pre) > code"))
  for (const code of codeNodes) {
    const text = (code.textContent ?? "").trim()
    const href = codeUrl(text)
    if (href) continue

    const parentLink =
      code.parentElement instanceof HTMLAnchorElement && code.parentElement.classList.contains("external-link")
        ? code.parentElement
        : null

    const info = parseFilePath(text, workspace)
    if (!info) {
      if (parentLink && parentLink.classList.contains("file-link")) {
        parentLink.replaceWith(code)
      }
      continue
    }

    const fileHref = `file://${encodeFilePath(info.path)}${info.line ? `?line=${info.line}` : ""}${info.endLine ? `&endLine=${info.endLine}` : ""}`

    if (parentLink) {
      parentLink.href = fileHref
      parentLink.classList.add("file-link")
      if (info.line) parentLink.setAttribute("data-line", String(info.line))
      else parentLink.removeAttribute("data-line")
      if (info.endLine) parentLink.setAttribute("data-end-line", String(info.endLine))
      else parentLink.removeAttribute("data-end-line")
      continue
    }

    const link = document.createElement("a")
    link.href = fileHref
    link.className = "external-link file-link"
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    if (info.line) link.setAttribute("data-line", String(info.line))
    if (info.endLine) link.setAttribute("data-end-line", String(info.endLine))
    code.parentNode?.replaceChild(link, code)
    link.appendChild(code)
  }
}

export { codeUrl, markCodeFileLinks }
