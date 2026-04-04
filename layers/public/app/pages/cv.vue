<script setup lang="ts">
const { t, tm, rt } = useI18n()

useSeoMeta({
  title: `${t('nav.cv')} - ${t('app.title')}`,
  description: t('cv_data.basics.summary'),
})

function resolveArray(key: string): Array<Record<string, unknown>> {
  const raw = tm(key)
  if (!Array.isArray(raw)) return []
  return raw.map((item: Record<string, unknown>) => {
    const resolved: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(item)) {
      if (Array.isArray(v)) {
        resolved[k] = v.map((el: unknown) => rt(el as string))
      } else if (typeof v === 'object' && v !== null) {
        resolved[k] = rt(v as string)
      } else {
        resolved[k] = rt(v as string)
      }
    }
    return resolved
  })
}

function resolveStringArray(key: string): string[] {
  const raw = tm(key)
  if (!Array.isArray(raw)) return []
  return raw.map((v: unknown) => rt(v as string))
}

const work = computed(() => resolveArray('cv_data.work'))
const education = computed(() => resolveArray('cv_data.education'))
const languages = computed(() => resolveArray('cv_data.languages'))
const projects = computed(() => resolveArray('cv_data.projects'))
const certifications = computed(() => resolveStringArray('cv_data.certifications'))
const softSkills = computed(() => resolveStringArray('cv_data.soft_skills'))
const skillKeys = ['frontend', 'backend', 'design', 'tools', 'ai', 'principles'] as const

const cvContent = useTemplateRef<HTMLElement>('cv-content')
const { generate, isGenerating } = useGeneratePdf()

function handleDownload() {
  if (cvContent.value) {
    generate(cvContent.value, `${t('cv_data.basics.name')}.pdf`)
  }
}
</script>

<template>
  <div>
    <div ref="cv-content" class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
      <!-- Sidebar -->
      <aside class="space-y-8">
        <!-- Contact -->
        <div class="space-y-3">
          <h2 class="text-2xl font-extrabold">{{ t('cv_data.basics.name') }}</h2>
          <p class="text-sm font-medium text-(--ui-color-primary-500)">{{ t('cv_data.basics.label') }}</p>
          <div class="text-sm text-(--ui-text-muted) space-y-1.5">
            <p class="flex items-center gap-2"><UIcon name="i-lucide-map-pin" class="size-4 shrink-0" /> {{ t('cv_data.basics.location') }}</p>
            <p class="flex items-center gap-2"><UIcon name="i-lucide-mail" class="size-4 shrink-0" /> fco.j.sarmientoperez@gmail.com</p>
            <p class="flex items-center gap-2"><UIcon name="i-lucide-phone" class="size-4 shrink-0" /> +34 696124038</p>
          </div>
          <div class="flex gap-2 pt-1">
            <UButton to="https://www.linkedin.com/in/fcojacob/" icon="i-lucide-linkedin" size="sm" variant="outline" target="_blank" external aria-label="LinkedIn" />
            <UButton to="https://github.com/FcoJacob" icon="i-lucide-github" size="sm" variant="outline" target="_blank" external aria-label="GitHub" />
            <UButton
              :label="t('common.download_pdf')"
              icon="i-lucide-download"
              size="sm"
              variant="outline"
              :loading="isGenerating"
              @click="handleDownload"
            />
          </div>
        </div>

        <USeparator />

        <!-- Skills -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold uppercase tracking-wider text-(--ui-text-muted)">{{ t('cv.skills') }}</h3>
          <div v-for="key in skillKeys" :key="key" class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold">{{ t(`cv_data.skills.${key}.name`) }}</span>
              <UBadge :label="t(`cv_data.skills.${key}.level`)" :color="t(`cv_data.skills.${key}.level`) === 'Senior' ? 'success' : 'neutral'" variant="subtle" size="sm" />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <UBadge v-for="kw in resolveStringArray(`cv_data.skills.${key}.keywords`)" :key="kw" :label="kw" color="neutral" variant="outline" size="sm" />
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Soft Skills -->
        <div class="space-y-3">
          <h3 class="text-sm font-bold uppercase tracking-wider text-(--ui-text-muted)">{{ t('cv.soft_skills') }}</h3>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="skill in softSkills" :key="skill" :label="skill" color="neutral" variant="subtle" size="sm" />
          </div>
        </div>

        <USeparator />

        <!-- Languages -->
        <div class="space-y-3">
          <h3 class="text-sm font-bold uppercase tracking-wider text-(--ui-text-muted)">{{ t('cv.languages') }}</h3>
          <div class="space-y-1">
            <div v-for="lang in languages" :key="lang.language as string" class="flex items-center justify-between text-sm">
              <span>{{ lang.language }}</span>
              <span class="text-(--ui-text-muted)">{{ lang.fluency }}</span>
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Certifications -->
        <div class="space-y-3">
          <h3 class="text-sm font-bold uppercase tracking-wider text-(--ui-text-muted)">{{ t('cv.certifications') }}</h3>
          <ul class="text-sm space-y-1 text-(--ui-text-muted)">
            <li v-for="cert in certifications" :key="cert" class="flex items-start gap-2">
              <UIcon name="i-lucide-check" class="size-3.5 mt-0.5 text-(--ui-color-primary-500) shrink-0" />
              {{ cert }}
            </li>
          </ul>
        </div>

        <USeparator />

        <!-- Driving -->
        <div class="space-y-2">
          <h3 class="text-sm font-bold uppercase tracking-wider text-(--ui-text-muted)">{{ t('cv.driving') }}</h3>
          <p class="text-sm">{{ t('cv_data.driving') }}</p>
        </div>
      </aside>

      <!-- Main content -->
      <div class="space-y-10">
        <!-- Summary -->
        <section>
          <p class="text-base leading-relaxed text-(--ui-text-dimmed)">{{ t('cv_data.basics.summary') }}</p>
        </section>

        <!-- Work Experience -->
        <section>
          <h2 class="text-lg font-bold uppercase tracking-wider text-(--ui-text-muted) mb-6">{{ t('cv.work') }}</h2>
          <div class="relative border-l-2 border-(--ui-border) pl-6 space-y-8">
            <div v-for="(job, i) in work" :key="i" class="relative">
              <span class="absolute -left-[calc(1.5rem+5px)] top-1.5 size-2.5 rounded-full bg-(--ui-color-primary-500)" />
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                <div>
                  <h3 class="font-semibold">{{ job.position }}</h3>
                  <p class="text-sm text-(--ui-color-primary-500) font-medium">{{ job.name }}</p>
                </div>
                <span class="text-xs text-(--ui-text-muted) bg-(--ui-bg-elevated) px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                  {{ job.startDate }} — {{ job.endDate || t('cv.present') }}
                </span>
              </div>
              <p class="mt-2 text-sm text-(--ui-text-muted)">{{ job.summary }}</p>
              <ul v-if="(job.highlights as string[])?.length" class="mt-2 space-y-1">
                <li v-for="h in (job.highlights as string[])" :key="h" class="flex items-start gap-2 text-sm text-(--ui-text-muted)">
                  <UIcon name="i-lucide-chevron-right" class="size-3.5 mt-0.5 shrink-0 text-(--ui-color-primary-500)" />
                  {{ h }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Education -->
        <section>
          <h2 class="text-lg font-bold uppercase tracking-wider text-(--ui-text-muted) mb-6">{{ t('cv.education') }}</h2>
          <div class="relative border-l-2 border-(--ui-border) pl-6 space-y-6">
            <div v-for="(edu, i) in education" :key="i" class="relative">
              <span class="absolute -left-[calc(1.5rem+5px)] top-1.5 size-2.5 rounded-full bg-(--ui-border)" />
              <h3 class="font-semibold">{{ edu.institution }}</h3>
              <p class="text-sm text-(--ui-color-primary-500)">{{ edu.studyType }} — {{ edu.area }}</p>
              <p class="text-xs text-(--ui-text-muted)">{{ edu.startDate }} — {{ edu.endDate || t('cv.present') }}</p>
              <p v-if="edu.note" class="text-xs text-(--ui-text-muted) italic">{{ edu.note }}</p>
            </div>
          </div>
        </section>

        <!-- Projects -->
        <section>
          <h2 class="text-lg font-bold uppercase tracking-wider text-(--ui-text-muted) mb-6">{{ t('cv.projects') }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UCard v-for="(project, i) in projects" :key="i" variant="subtle">
              <div class="space-y-2">
                <h3 class="font-semibold text-sm">{{ project.name }}</h3>
                <p class="text-xs text-(--ui-text-muted) line-clamp-2">{{ project.description }}</p>
                <UButton
                  v-if="project.url"
                  :to="project.url as string"
                  :label="t('common.visit')"
                  size="sm"
                  variant="outline"
                  icon="i-lucide-external-link"
                  target="_blank"
                  external
                />
              </div>
            </UCard>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
