/**
 * abcjs code-block transform.
 *
 * Renders ```abcjs fenced code blocks (any text format that emits
 * <pre><code class="language-abcjs">) as SVG scores using the bundled abcjs
 * build (ABCJS global; a custom build that emits <use>/<defs> for compact DOM
 * trees) with js-yaml (jsyaml global) parsing an optional YAML frontmatter
 * section at the top of the block.
 *
 * Frontmatter:
 *   ---
 *   staffwidths:
 *     narrow: 320
 *     wide: 640
 *     full: 960
 *   ---
 *   <ABC notation…>
 *
 * Each named staff width is pre-rendered as its own variant
 * (div.abcjs-variant.<name>) inside one div.abcjs-container. Which variant
 * displays is pure CSS (Styles/abc.css): a container query against the reading
 * column, with media-query and first-child fallbacks — no reading-system
 * JavaScript. The conventional names are narrow / wide / full; the CSS only
 * knows those three, so other names render but never display (the narrowest —
 * first — variant is the universal fallback). Any other frontmatter keys are
 * merged into the abcjs render options.
 *
 * All <defs> are deduplicated into a single zero-size SVG placed first in the
 * container: <use> references resolve document-wide, and keeping the shared
 * glyphs OUT of a display:none variant avoids WebKit's troubles resolving
 * <use> into hidden subtrees.
 *
 * @param {Document} document - the chapter's rendered DOM (HTML)
 * @param {string} idref - spine item id for this chapter
 * @returns {Document} the transformed document
 */

const SVGNS = 'http://www.w3.org/2000/svg'

function fixSvgViewBoxes(container, staffwidth) {
  // Workaround for renders whose viewBox ends up with zero height: recompute it
  // from the top-level groups, abcjs-style.
  container.querySelectorAll('svg').forEach(svg => {
    const currentViewBox = svg.getAttribute('viewBox')
    if (!currentViewBox || !currentViewBox.endsWith(' 0')) return

    const sections = svg.querySelectorAll('svg > g')
    let minY = Infinity
    let maxY = -Infinity
    const width = staffwidth

    sections.forEach(section => {
      // getBBox works when the element is attached and rendered.
      try {
        const box = section.getBBox()
        if (box.height > 0) {
          minY = Math.min(minY, box.y)
          maxY = Math.max(maxY, box.y + box.height)
          return
        }
      } catch (e) {}

      // Fallback: parse path and text coordinates.
      section.querySelectorAll('path').forEach(path => {
        const d = path.getAttribute('d')
        if (d) {
          extractYCoordinates(d).forEach(y => {
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y + 5) // small height allowance for lines
          })
        }
      })
      section.querySelectorAll('text').forEach(text => {
        const y = parseFloat(text.getAttribute('y') || 0)
        const fontSize = parseFloat(text.getAttribute('font-size') || 16)
        minY = Math.min(minY, y - fontSize)
        maxY = Math.max(maxY, y + 5)
      })
    })

    if (isFinite(minY) && isFinite(maxY) && maxY > minY) {
      svg.setAttribute('viewBox', `0 ${Math.max(0, minY)} ${width} ${maxY - minY}`)
    } else {
      // Ultimate fallback based on music notation proportions.
      svg.setAttribute('viewBox', '0 0 350 100')
    }
  })
}

function extractYCoordinates(pathData) {
  const coords = []
  const matches = pathData.match(/[ML]\s*([\d.-]+)\s+([\d.-]+)/g)
  if (matches) {
    matches.forEach(match => {
      const parts = match.split(/\s+/)
      if (parts.length >= 3) coords.push(parseFloat(parts[2]))
    })
  }
  return coords
}

/**
 * Deduplicate every <defs> in the container into one zero-size, always-rendered
 * SVG inserted as the container's first child. The glyph ids are identical
 * across variants (same abcjs build, same tune), so one copy serves them all.
 */
function hoistDefs(document, container) {
  const allDefs = [...container.querySelectorAll('svg defs')]
  if (allDefs.length === 0) return

  const holder = document.createElementNS(SVGNS, 'svg')
  holder.setAttribute('class', 'abcjs-defs')
  holder.setAttribute('aria-hidden', 'true')
  holder.setAttribute('focusable', 'false')
  holder.setAttribute('width', '0')
  holder.setAttribute('height', '0')
  holder.appendChild(allDefs[0])
  allDefs.slice(1).forEach(d => d.remove())
  container.insertBefore(holder, container.firstChild)
}

function transformDOM(document, idref) {
  const codes = document.querySelectorAll('pre:has(code.language-abcjs)')

  const defaultOptions = {
    staffwidth: 360,
    add_classes: true,
    scale: 1.0,
    oneSvgPerLine: true,
    responsive: 'resize',
    textboxpadding: 0,
    paddingleft: 0,
    paddingtop: 0,
    paddingright: 0,
    paddingbottom: 0,
    initialClef: false,
    format: {
      vocalfont: 'serif 16',
    },
    wrap: {
      minSpacing: 1.45,
      maxSpacing: 2.8,
      preferredMeasuresPerLine: 0,
    },
  }

  codes.forEach(c => {
    let options = { ...defaultOptions }

    const container = document.createElement('div')
    container.setAttribute('class', 'abcjs-container')
    // The render target must be attached to the DOM (abcjs measures as it
    // draws); moved into the code block's place when complete.
    document.body.appendChild(container)

    let abcContent = c.querySelector('code').textContent
    const frontmatterMatch = abcContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

    let staffwidthConfigs = null

    if (frontmatterMatch) {
      const [, frontmatterText, content] = frontmatterMatch
      abcContent = content.trim()

      try {
        const frontmatterOptions = jsyaml.load(frontmatterText)

        if (
          frontmatterOptions.staffwidths &&
          typeof frontmatterOptions.staffwidths === 'object' &&
          !Array.isArray(frontmatterOptions.staffwidths)
        ) {
          staffwidthConfigs = []
          Object.entries(frontmatterOptions.staffwidths).forEach(([name, width]) => {
            const numWidth = Number(width)
            if (!isNaN(numWidth) && numWidth > 0) {
              staffwidthConfigs.push({ name, width: numWidth })
            }
          })
          // Narrowest first — it doubles as the universal display fallback.
          staffwidthConfigs.sort((a, b) => a.width - b.width)
          delete frontmatterOptions.staffwidths
        }

        // Remaining frontmatter keys are abcjs render options.
        options = { ...options, ...frontmatterOptions }
      } catch (err) {
        console.error(err)
      }
    }
    if (!staffwidthConfigs || staffwidthConfigs.length === 0) {
      staffwidthConfigs = [{ name: 'default', width: options.staffwidth }]
    }

    // Stamp the facts the stylesheet needs as classes, so abc.css needs no
    // :has() (newer than container queries — no good as a fallback dependency):
    // which conventional variants exist, which is the narrowest (the universal
    // fallback) and which the widest.
    const names = staffwidthConfigs.map(cfg => cfg.name)
    if (!names.includes('wide')) container.classList.add('no-wide')
    if (!names.includes('full')) container.classList.add('no-full')

    staffwidthConfigs.forEach((config, i) => {
      const variant = document.createElement('div')
      const roles = [
        i === 0 ? 'is-default' : '',
        i === staffwidthConfigs.length - 1 ? 'is-widest' : '',
      ]
      variant.setAttribute(
        'class',
        ['abcjs-variant', config.name, ...roles].filter(Boolean).join(' ')
      )
      container.appendChild(variant)

      ABCJS.renderAbc(variant, abcContent, { ...options, staffwidth: config.width })
      fixSvgViewBoxes(variant, config.width)

      // The renderer writes display:inline-block into the element style, which
      // would defeat the stylesheet's variant switching; clear it.
      variant.style.display = ''
    })

    hoistDefs(document, container)

    c.replaceWith(container)
  })

  return document
}
