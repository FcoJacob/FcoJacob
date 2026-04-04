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
    try { return rt(v as any) } catch { return String(v) }
  })
}
</script>

<template>
  <div class="space-y-24">
    <!-- Hero -->
    <section class="relative py-16 lg:py-24">
      <div class="flex flex-col lg:flex-row items-center gap-12">
        <div class="flex-1 space-y-6">
          <UBadge color="success" variant="subtle" size="md" icon="i-lucide-circle-check">
            {{ t('hero.available') }}
          </UBadge>
          <h1 class="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            {{ t('cv_data.basics.name') }}
          </h1>
          <p class="text-xl lg:text-2xl text-(--ui-text-muted) font-medium">
            {{ t('cv_data.basics.label') }}
          </p>
          <p class="text-base text-(--ui-text-dimmed) max-w-xl leading-relaxed">
            {{ t('hero.summary') }}
          </p>
          <div class="flex flex-wrap gap-3 pt-2">
            <UButton
              :label="t('hero.cta')"
              to="/cv"
              size="lg"
              icon="i-lucide-arrow-right"
              trailing
            />
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
        <div class="w-full lg:w-auto">
          <UCard class="lg:min-w-80">
            <div class="grid grid-cols-1 gap-6 p-2">
              <div class="text-center">
                <p class="text-3xl font-extrabold text-(--ui-color-primary-500)">+6</p>
                <p class="text-sm text-(--ui-text-muted) mt-1">{{ t('hero.stats_experience') }}</p>
              </div>
              <USeparator />
              <div class="text-center">
                <p class="text-3xl font-extrabold text-(--ui-color-primary-500)">+10</p>
                <p class="text-sm text-(--ui-text-muted) mt-1">{{ t('hero.stats_projects') }}</p>
              </div>
              <USeparator />
              <div class="text-center">
                <p class="text-3xl font-extrabold text-(--ui-color-primary-500)">Vue · Nuxt</p>
                <p class="text-sm text-(--ui-text-muted) mt-1">{{ t('hero.stats_stack') }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </section>

    <!-- Skills -->
    <section>
      <h2 class="text-2xl font-bold mb-8">
        {{ t('cv.skills') }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard v-for="key in skillKeys" :key="key" variant="subtle">
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
    <section>
      <h2 class="text-2xl font-bold mb-8">
        {{ t('nav.projects') }}
      </h2>
      <ProjectCarousel />
    </section>
  </div>
</template>
