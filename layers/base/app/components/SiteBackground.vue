<script setup lang="ts">
/**
 * Decorative background used on the public site.
 * - Animated gradient orbs with slow parallax on scroll
 * - Faint grid pattern masked with a radial fade
 * Fully respects `prefers-reduced-motion` (no motion when enabled).
 */
const orb1 = useTemplateRef<HTMLElement>('orb1')
const orb2 = useTemplateRef<HTMLElement>('orb2')
const orb3 = useTemplateRef<HTMLElement>('orb3')

onMounted(async () => {
  if (typeof window === 'undefined') return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return

  const { default: gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  // Endless floating
  gsap.to(orb1.value, { x: 40, y: 30, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  gsap.to(orb2.value, { x: -50, y: 40, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 })
  gsap.to(orb3.value, { x: 30, y: -40, duration: 13, ease: 'sine.inOut', yoyo: true, repeat: -1 })

  // Scroll parallax
  gsap.to(orb1.value, {
    yPercent: -20,
    ease: 'none',
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom top', scrub: true },
  })
  gsap.to(orb2.value, {
    yPercent: 25,
    ease: 'none',
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom top', scrub: true },
  })
  gsap.to(orb3.value, {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom top', scrub: true },
  })
})
</script>

<template>
  <div aria-hidden="true" class="site-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div ref="orb1" class="orb orb-primary" />
    <div ref="orb2" class="orb orb-secondary" />
    <div ref="orb3" class="orb orb-tertiary" />
    <div class="grid-overlay" />
  </div>
</template>

<style scoped>
.site-bg {
  background: var(--ui-bg);
}

.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.28;
  will-change: transform;
}

html.dark .orb {
  opacity: 0.22;
}

.orb-primary {
  width: 520px;
  height: 520px;
  top: -120px;
  left: -140px;
  background: radial-gradient(circle at 30% 30%, var(--ui-color-primary-500), transparent 70%);
}

.orb-secondary {
  width: 460px;
  height: 460px;
  top: 40%;
  right: -120px;
  background: radial-gradient(
    circle at 60% 40%,
    var(--ui-color-secondary-500, #8b5cf6),
    transparent 70%
  );
}

.orb-tertiary {
  width: 400px;
  height: 400px;
  bottom: -140px;
  left: 30%;
  background: radial-gradient(circle at 50% 50%, #22c55e, transparent 70%);
  opacity: 0.18;
}

html.dark .orb-tertiary {
  opacity: 0.14;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--ui-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--ui-border) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
  opacity: 0.25;
}

html.dark .grid-overlay {
  opacity: 0.18;
}

@media (max-width: 640px) {
  .orb {
    filter: blur(70px);
  }
  .orb-primary {
    width: 340px;
    height: 340px;
  }
  .orb-secondary {
    width: 300px;
    height: 300px;
  }
  .orb-tertiary {
    width: 280px;
    height: 280px;
  }
}
</style>
