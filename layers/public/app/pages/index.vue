<script setup lang="ts">
const { t, tm, rt } = useI18n()

useSeoMeta({
  title: t('app.title'),
  description: t('app.description'),
})

const skillKeys = ['frontend', 'backend', 'design', 'tools', 'ai', 'principles'] as const

function resolveStringArray(key: string): string[] {
  const raw = tm(key)
  if (!Array.isArray(raw)) return []
  return raw.map((v: unknown) => {
    if (typeof v === 'string') return v
    try {
      return rt(v as any)
    } catch {
      return String(v)
    }
  })
}

// Marquee tape of core technologies
const stack = [
  'Vue 3',
  'Nuxt 4',
  'TypeScript',
  'Tailwind',
  'Convex',
  'Pinia',
  'Vitest',
  'Playwright',
  'Node.js',
  'Figma',
  'GSAP',
]

// Refs
const heroTitle = useTemplateRef<HTMLElement>('heroTitle')
const heroBadge = useTemplateRef<HTMLElement>('heroBadge')
const heroSubtitle = useTemplateRef<HTMLElement>('heroSubtitle')
const heroSummary = useTemplateRef<HTMLElement>('heroSummary')
const heroActions = useTemplateRef<HTMLElement>('heroActions')
const statsCard = useTemplateRef<HTMLElement>('statsCard')
const ctaPrimary = useTemplateRef<HTMLElement>('ctaPrimary')
const statExperience = useTemplateRef<HTMLElement>('statExperience')
const statProjects = useTemplateRef<HTMLElement>('statProjects')
const scrollHint = useTemplateRef<HTMLElement>('scrollHint')

// Magnetic primary CTA
useMagnetic(ctaPrimary, { strength: 14, radius: 140 })

// Animated counters
useCounter(statExperience, 6, { prefix: '+', duration: 1.8 })
useCounter(statProjects, 10, { prefix: '+', duration: 1.8, delay: 0.15 })

onMounted(async () => {
  if (typeof window === 'undefined') return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Split title into words wrapped in spans for staggered reveal
  const titleEl = heroTitle.value
  if (titleEl) {
    const words = (titleEl.textContent ?? '').trim().split(/\s+/)
    titleEl.innerHTML = words
      .map((w) => `<span class="hero-word"><span class="hero-word-inner">${w}</span></span>`)
      .join(' ')
  }

  if (reduced) return

  const { default: gsap } = await import('gsap')

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.from(heroBadge.value, { opacity: 0, y: 14, duration: 0.6 })
    .from(
      titleEl?.querySelectorAll('.hero-word-inner') ?? [],
      {
        yPercent: 120,
        opacity: 0,
        duration: 0.9,
        stagger: 0.07,
      },
      '-=0.2',
    )
    .from(heroSubtitle.value, { opacity: 0, y: 20, duration: 0.7 }, '-=0.4')
    .from(heroSummary.value, { opacity: 0, y: 16, duration: 0.7 }, '-=0.5')
    .from(
      heroActions.value?.children ?? [],
      {
        opacity: 0,
        y: 18,
        duration: 0.6,
        stagger: 0.08,
      },
      '-=0.5',
    )
    .from(
      statsCard.value,
      {
        opacity: 0,
        y: 30,
        scale: 0.96,
        duration: 0.9,
        ease: 'power3.out',
      },
      '-=0.7',
    )
    .from(scrollHint.value, { opacity: 0, y: -10, duration: 0.6 }, '-=0.3')

  // Floating stats card
  gsap.to(statsCard.value, {
    y: -10,
    duration: 3.4,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  })

  // Subtle scroll hint bounce
  gsap.to(scrollHint.value?.querySelector('.scroll-hint-dot') ?? null, {
    y: 8,
    duration: 1.1,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  })
})
</script>

<template>
  <div class="space-y-28">
    <!-- Hero -->
    <section class="hero relative py-12 lg:py-20">
      <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div class="flex-1 space-y-6 lg:space-y-7">
          <div ref="heroBadge">
            <UBadge color="success" variant="subtle" size="md" class="hero-badge">
              <span
                class="size-1.5 rounded-full bg-(--ui-color-success-500) animate-pulse mr-1.5"
              />
              {{ t('hero.available') }}
            </UBadge>
          </div>

          <h1
            ref="heroTitle"
            class="hero-title text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05]"
          >
            {{ t('cv_data.basics.name') }}
          </h1>

          <p ref="heroSubtitle" class="text-xl lg:text-2xl font-semibold text-gradient">
            {{ t('cv_data.basics.label') }}
          </p>

          <p
            ref="heroSummary"
            class="text-base lg:text-lg text-(--ui-text-muted) max-w-xl leading-relaxed"
          >
            {{ t('hero.summary') }}
          </p>

          <div ref="heroActions" class="flex flex-wrap gap-3 pt-3">
            <div ref="ctaPrimary" class="will-change-transform">
              <UButton
                :label="t('hero.cta')"
                to="/cv"
                size="lg"
                icon="i-lucide-arrow-right"
                trailing
                class="cta-shine"
              />
            </div>
            <UButton
              :label="t('hero.cta2')"
              to="mailto:fco.j.sarmientoperez@gmail.com"
              size="lg"
              variant="outline"
              icon="i-lucide-mail"
              external
            />
          </div>
        </div>

        <!-- Stats card -->
        <div ref="statsCard" class="w-full lg:w-auto will-change-transform">
          <UCard class="stats-card lg:min-w-80 backdrop-blur-sm">
            <div class="grid grid-cols-1 gap-6 p-2">
              <div class="text-center">
                <p
                  ref="statExperience"
                  class="text-4xl font-extrabold bg-gradient-to-br from-(--ui-color-primary-500) to-(--ui-color-primary-700) bg-clip-text text-transparent"
                >
                  +6
                </p>
                <p class="text-sm text-(--ui-text-muted) mt-1">{{ t('hero.stats_experience') }}</p>
              </div>
              <USeparator />
              <div class="text-center">
                <p
                  ref="statProjects"
                  class="text-4xl font-extrabold bg-gradient-to-br from-(--ui-color-primary-500) to-(--ui-color-primary-700) bg-clip-text text-transparent"
                >
                  +10
                </p>
                <p class="text-sm text-(--ui-text-muted) mt-1">{{ t('hero.stats_projects') }}</p>
              </div>
              <USeparator />
              <div class="text-center">
                <p class="text-2xl font-extrabold">Vue · Nuxt</p>
                <p class="text-sm text-(--ui-text-muted) mt-1">{{ t('hero.stats_stack') }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Scroll hint -->
      <div
        ref="scrollHint"
        class="hidden lg:flex absolute -bottom-4 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.25em] text-(--ui-text-muted)"
      >
        <span>scroll</span>
        <span class="scroll-hint-rail relative block w-px h-10 bg-(--ui-border) overflow-hidden">
          <span
            class="scroll-hint-dot absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-(--ui-color-primary-500)"
          />
        </span>
      </div>
    </section>

    <!-- Stack marquee -->
    <section class="marquee-mask -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
      <div class="marquee py-2">
        <template v-for="n in 2" :key="n">
          <span
            v-for="item in stack"
            :key="`${n}-${item}`"
            class="text-2xl sm:text-3xl font-extrabold tracking-tight text-(--ui-text-muted) hover:text-(--ui-text) transition-colors duration-300 flex items-center gap-10"
          >
            {{ item }}
            <span class="size-1.5 rounded-full bg-(--ui-color-primary-500)/60" />
          </span>
        </template>
      </div>
    </section>

    <!-- Skills -->
    <section v-reveal>
      <div class="flex items-end justify-between mb-10">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-(--ui-color-primary-500) mb-2">
            {{ t('cv.skills') }}
          </p>
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {{ t('cv_data.basics.label') }}
          </h2>
        </div>
      </div>
      <div v-reveal.stagger class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard
          v-for="key in skillKeys"
          :key="key"
          variant="subtle"
          class="skill-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-(--ui-color-primary-500)/30"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">{{ t(`cv_data.skills.${key}.name`) }}</h3>
              <UBadge
                :label="t(`cv_data.skills.${key}.level`)"
                :color="t(`cv_data.skills.${key}.level`) === 'Senior' ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="kw in resolveStringArray(`cv_data.skills.${key}.keywords`)"
                :key="kw"
                :label="kw"
                color="neutral"
                variant="outline"
                size="sm"
              />
            </div>
          </div>
        </UCard>
      </div>
    </section>

    <!-- Projects Carousel -->
    <section v-reveal>
      <div class="flex items-end justify-between mb-10">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-(--ui-color-primary-500) mb-2">
            Selected work
          </p>
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {{ t('nav.projects') }}
          </h2>
        </div>
        <NuxtLink
          to="/projects"
          class="group hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-(--ui-text-muted) hover:text-(--ui-color-primary-500) transition-colors"
        >
          {{ t('common.view_all') }}
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4 transition-transform group-hover:translate-x-1"
          />
        </NuxtLink>
      </div>
      <ProjectCarousel />
    </section>
  </div>
</template>

<style scoped>
.hero-title :deep(.hero-word) {
  display: inline-block;
  overflow: hidden;
  padding-bottom: 0.08em;
  line-height: 1.05;
}
.hero-title :deep(.hero-word-inner) {
  display: inline-block;
  will-change: transform, opacity;
}

.stats-card {
  background: linear-gradient(
    145deg,
    color-mix(in oklch, var(--ui-bg-elevated) 70%, transparent) 0%,
    var(--ui-bg-elevated) 100%
  );
}

.cta-shine {
  position: relative;
  overflow: hidden;
}
.cta-shine::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(255, 255, 255, 0.25) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  transition: transform 0.8s ease;
  pointer-events: none;
}
.cta-shine:hover::after {
  transform: translateX(100%);
}
</style>
