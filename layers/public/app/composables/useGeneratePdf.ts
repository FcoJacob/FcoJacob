export function useGeneratePdf() {
  const isGenerating = ref(false)

  async function generate(element: HTMLElement, filename = 'cv.pdf') {
    if (isGenerating.value) return
    isGenerating.value = true

    try {
      // Use a print iframe to generate the PDF via the browser's native print
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-9999px'
      iframe.style.width = '794px' // A4 width at 96dpi
      iframe.style.height = '1123px'
      document.body.appendChild(iframe)

      const doc = iframe.contentDocument!
      // Copy all stylesheets
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      doc.head.innerHTML = styles.map((s) => {
        if (s.tagName === 'STYLE') return s.outerHTML
        return s.outerHTML
      }).join('')

      // Add print-specific overrides
      const printStyle = doc.createElement('style')
      printStyle.textContent = `
        @page { margin: 12mm; size: A4; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #111827; background: white; }
        * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        @media print { body { background: white; } }
      `
      doc.head.appendChild(printStyle)

      // Clone the CV content
      doc.body.innerHTML = ''
      doc.body.appendChild(element.cloneNode(true))

      // Set document title for the PDF filename
      doc.title = filename.replace('.pdf', '')

      // Wait for styles to load
      await new Promise(r => setTimeout(r, 500))

      iframe.contentWindow!.print()

      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }
    finally {
      isGenerating.value = false
    }
  }

  return { generate, isGenerating }
}
