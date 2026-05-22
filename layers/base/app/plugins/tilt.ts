import type { Directive } from 'vue'

export default defineNuxtPlugin(async (nuxtApp) => {
  // SSR stub: server-side does not run visual animations
  if (!import.meta.client) {
    nuxtApp.vueApp.directive('tilt', {
      getSSRProps() {
        return {}
      },
    })
    return
  }

  const { default: gsap } = await import('gsap')

  const tiltDirective: Directive<HTMLElement> = {
    mounted(el) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      // Dynamic glare overlay element
      const glare = document.createElement('div')
      glare.className = 'tilt-glare absolute inset-0 pointer-events-none opacity-0 rounded-[inherit] transition-opacity duration-300'
      glare.style.background = 'radial-gradient(circle 200px at 50% 50%, rgba(255, 255, 255, 0.05), transparent)'
      
      // Ensure positioning context is set
      const style = window.getComputedStyle(el)
      if (style.position === 'static') {
        el.style.position = 'relative'
      }
      el.style.transformStyle = 'preserve-3d'
      el.appendChild(glare)

      // GSAP quickTo hooks for incredibly buttery smooth spring movements
      const xTo = gsap.quickTo(el, 'rotateY', { duration: 0.5, ease: 'power2.out' })
      const yTo = gsap.quickTo(el, 'rotateX', { duration: 0.5, ease: 'power2.out' })
      const scaleTo = gsap.quickTo(el, 'scale', { duration: 0.5, ease: 'power2.out' })
      const glareX = gsap.quickTo(glare, 'xPercent', { duration: 0.5, ease: 'power2.out' })
      const glareY = gsap.quickTo(glare, 'yPercent', { duration: 0.5, ease: 'power2.out' })
      const glareOpacity = gsap.quickTo(glare, 'opacity', { duration: 0.4, ease: 'power2.out' })

      function onMouseMove(event: MouseEvent) {
        const rect = el.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        
        // Relative mouse coordinates from center (-rect.width/2 to rect.width/2)
        const mouseX = event.clientX - rect.left - width / 2
        const mouseY = event.clientY - rect.top - height / 2

        // Tilt calculation (Max 7.5 degrees to avoid clipping or excessive rotation)
        const tiltX = -(mouseY / (height / 2)) * 7.5
        const tiltY = (mouseX / (width / 2)) * 7.5

        yTo(tiltX)
        xTo(tiltY)
        scaleTo(1.025) // Subtle hover pop

        // Glare dynamic placement mapping (-50% to 50%)
        glareOpacity(0.9) // Show reflection
        glareX((mouseX / width) * 100)
        glareY((mouseY / height) * 100)
      }

      function onMouseLeave() {
        xTo(0)
        yTo(0)
        scaleTo(1)
        glareOpacity(0)
      }

      el.addEventListener('mousemove', onMouseMove, { passive: true })
      el.addEventListener('mouseleave', onMouseLeave)

      // Store event listeners for proper teardown on unmount
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(el as any).__tilt_listeners = { onMouseMove, onMouseLeave }
    },
    unmounted(el) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = (el as any).__tilt_listeners
      if (listeners) {
        el.removeEventListener('mousemove', listeners.onMouseMove)
        el.removeEventListener('mouseleave', listeners.onMouseLeave)
      }
      gsap.killTweensOf(el)
      const glare = el.querySelector('.tilt-glare')
      if (glare) {
        gsap.killTweensOf(glare)
        glare.remove()
      }
    },
  }

  nuxtApp.vueApp.directive('tilt', tiltDirective)
})
