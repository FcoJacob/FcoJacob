export function useGeneratePdf() {
  const isGenerating = ref(false)

  async function generate(element: HTMLElement, filename = 'cv.pdf') {
    if (isGenerating.value) return
    isGenerating.value = true

    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save()
    }
    finally {
      isGenerating.value = false
    }
  }

  return { generate, isGenerating }
}
