<script setup lang="ts">
const { t, tm, rt, locale } = useI18n()

useSeoMeta({
  title: `${t('nav.cv')} - ${t('app.title')}`,
  description: t('seo.cv_description'),
  ogTitle: `${t('nav.cv')} - ${t('app.title')}`,
  ogDescription: t('seo.cv_description'),
})

// ── Primary data source: Convex (what the admin edits) ──────────
const { data: cv } = await useAsyncData(
  `cv-${locale.value}`,
  () => $fetch('/api/public/cv', { query: { locale: locale.value } }),
  { watch: [locale] },
)

const basics = computed(() => cv.value?.basics)
const work = computed(() => cv.value?.work ?? [])
const education = computed(() => cv.value?.education ?? [])
const skills = computed(() => cv.value?.skills ?? [])
const languages = computed(() => cv.value?.languages ?? [])
const cvProjects = computed(() => cv.value?.projects ?? [])

// ── i18n fallback for fields NOT in Convex schema ───────────────
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
const certifications = computed(() => resolveStringArray('cv_data.certifications'))
const softSkills = computed(() => resolveStringArray('cv_data.soft_skills'))

// ── Profiles from Convex basics ─────────────────────────────────
const linkedinUrl = computed(
  () => basics.value?.profiles?.find((p: any) => p.network === 'LinkedIn')?.url ?? '#',
)
const githubUrl = computed(
  () => basics.value?.profiles?.find((p: any) => p.network === 'GitHub')?.url ?? '#',
)

// ── Server-generated, ATS-parseable PDF (see server/routes/cv.pdf.get.ts)
const pdfUrl = computed(() => (locale.value === 'en' ? '/cv.pdf?locale=en' : '/cv.pdf'))

// ── Structured data: ProfilePage + Person for search engines ────
useHead(() => ({
  script: basics.value
    ? [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            mainEntity: {
              '@type': 'Person',
              name: basics.value.name,
              jobTitle: basics.value.label,
              email: `mailto:${basics.value.email}`,
              url: 'https://jsarmiento.dev',
              address: {
                '@type': 'PostalAddress',
                addressLocality: basics.value.location?.city,
                addressRegion: basics.value.location?.region,
                addressCountry: basics.value.location?.countryCode ?? 'ES',
              },
              sameAs: [linkedinUrl.value, githubUrl.value].filter((u) => u !== '#'),
              knowsAbout: skills.value.flatMap((s: any) => s.keywords ?? []),
            },
          }),
        },
      ]
    : [],
}))
</script>

<template>
  <div>
    <div v-if="cv" class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
      <!-- Sidebar -->
      <aside class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-8 gap-y-6 lg:gap-y-0 lg:space-y-8 lg:h-fit print:grid-cols-1 print:space-y-6 print:gap-y-0">
        <!-- Contact -->
        <div class="space-y-3 break-inside-avoid">
          <h1 class="text-2xl font-extrabold">{{ basics?.name }}</h1>
          <p class="text-base font-medium text-(--ui-color-primary-500)">
            {{ basics?.label }}
          </p>
          <div class="text-sm md:text-base text-(--ui-text-muted) space-y-1.5">
            <p class="flex items-center gap-2">
              <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
              {{ basics?.location?.city }}, {{ basics?.location?.region }}
            </p>
            <p class="flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="size-4 shrink-0" /> {{ basics?.email }}
            </p>
            <p v-if="basics?.phone" class="flex items-center gap-2">
              <UIcon name="i-lucide-phone" class="size-4 shrink-0" /> {{ basics?.phone }}
            </p>
          </div>
          <div class="flex gap-2 pt-1">
            <UButton
              :to="linkedinUrl"
              icon="i-lucide-linkedin"
              size="md"
              variant="outline"
              target="_blank"
              external
              aria-label="LinkedIn"
            />
            <UButton
              :to="githubUrl"
              icon="i-lucide-github"
              size="md"
              variant="outline"
              target="_blank"
              external
              aria-label="GitHub"
            />
            <UButton
              :label="t('common.download_pdf')"
              icon="i-lucide-download"
              size="md"
              variant="outline"
              :to="pdfUrl"
              external
              download
            />
          </div>
        </div>

        <USeparator class="sm:hidden lg:block print:block" />

        <!-- Skills -->
        <div class="space-y-4 break-inside-avoid">
          <h2 class="section-label">
            {{ t('cv.skills') }}
          </h2>
          <div v-for="skill in skills" :key="skill.name" class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-sm md:text-base font-semibold">{{ skill.name }}</span>
              <UBadge
                :label="skill.level"
                :color="skill.level === 'Senior' ? 'success' : 'neutral'"
                variant="subtle"
                size="md"
              />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="kw in skill.keywords"
                :key="kw"
                :label="kw"
                color="neutral"
                variant="outline"
                size="md"
              />
            </div>
          </div>
        </div>

        <USeparator class="sm:hidden lg:block print:block" />

        <!-- Soft Skills (i18n — not in Convex) -->
        <div class="space-y-3 break-inside-avoid">
          <h2 class="section-label">
            {{ t('cv.soft_skills') }}
          </h2>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="skill in softSkills"
              :key="skill"
              :label="skill"
              color="neutral"
              variant="subtle"
              size="md"
            />
          </div>
        </div>

        <USeparator class="sm:hidden lg:block print:block" />

        <!-- Languages -->
        <div class="space-y-3 break-inside-avoid">
          <h2 class="section-label">
            {{ t('cv.languages') }}
          </h2>
          <div class="space-y-1">
            <div
              v-for="lang in languages"
              :key="lang.language"
              class="flex items-center justify-between text-sm"
            >
              <span>{{ lang.language }}</span>
              <span class="text-(--ui-text-muted)">{{ lang.fluency }}</span>
            </div>
          </div>
        </div>

        <USeparator class="sm:hidden lg:block print:block" />

        <!-- Certifications (i18n — not in Convex) -->
        <div v-if="certifications.length" class="space-y-3 break-inside-avoid">
          <h2 class="section-label">
            {{ t('cv.certifications') }}
          </h2>
          <ul class="text-sm space-y-1 text-(--ui-text-muted)">
            <li v-for="cert in certifications" :key="cert" class="flex items-start gap-2">
              <UIcon
                name="i-lucide-check"
                class="size-3.5 mt-0.5 text-(--ui-color-primary-500) shrink-0"
              />
              {{ cert }}
            </li>
          </ul>
        </div>

        <USeparator class="sm:hidden lg:block print:block" />

        <!-- Driving (i18n) -->
        <div class="space-y-2 break-inside-avoid">
          <h2 class="section-label">
            {{ t('cv.driving') }}
          </h2>
          <p class="text-sm">{{ t('cv_data.driving') }}</p>
        </div>
      </aside>

      <!-- Main content -->
      <div class="space-y-10">
        <!-- Summary -->
        <section>
          <p class="text-base leading-relaxed text-(--ui-text-dimmed)">
            {{ basics?.summary }}
          </p>
        </section>

        <!-- Work Experience -->
        <section>
          <h2 class="section-label mb-6">
            {{ t('cv.work') }}
          </h2>
          <div class="relative border-l-2 border-(--ui-border) pl-6 space-y-8">
            <div v-for="(job, i) in work" :key="i" class="relative break-inside-avoid">
              <span
                class="absolute -left-[calc(1.5rem+5px)] top-1.5 size-2.5 rounded-full bg-(--ui-color-primary-500)"
              />
              <div
                class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4"
              >
                <div>
                  <h3 class="font-semibold text-base md:text-lg">{{ job.position }}</h3>
                  <p class="text-sm md:text-base text-(--ui-color-primary-500) font-medium">
                    {{ job.name }}
                  </p>
                </div>
                <span
                  class="text-xs md:text-sm text-(--ui-text-muted) bg-(--ui-bg-elevated) px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
                >
                  {{ job.startDate }} — {{ job.endDate || t('cv.present') }}
                </span>
              </div>
              <p class="mt-2 card-body">{{ job.summary }}</p>
              <ul v-if="job.highlights?.length" class="mt-2 space-y-1">
                <li v-for="h in job.highlights" :key="h" class="flex items-start gap-2 card-body">
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-3.5 mt-0.5 shrink-0 text-(--ui-color-primary-500)"
                  />
                  {{ h }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Education -->
        <section>
          <h2 class="section-label mb-6">
            {{ t('cv.education') }}
          </h2>
          <div class="relative border-l-2 border-(--ui-border) pl-6 space-y-6">
            <div v-for="(edu, i) in education" :key="i" class="relative break-inside-avoid">
              <span
                class="absolute -left-[calc(1.5rem+5px)] top-1.5 size-2.5 rounded-full bg-(--ui-border)"
              />
              <div
                class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4"
              >
                <div>
                  <h3 class="font-semibold text-base md:text-lg">{{ edu.institution }}</h3>
                  <p class="text-sm md:text-base text-(--ui-color-primary-500)">
                    {{ edu.studyType }} — {{ edu.area }}
                  </p>
                </div>
                <span
                  class="text-xs md:text-sm text-(--ui-text-muted) bg-(--ui-bg-elevated) px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
                >
                  {{ edu.startDate }} — {{ edu.endDate || t('cv.present') }}
                </span>
              </div>
              <p v-if="edu.score" class="mt-2 text-sm text-(--ui-text-muted) italic">
                {{ edu.score }}
              </p>
            </div>
          </div>
        </section>

        <!-- Projects -->
        <section>
          <h2 class="section-label mb-6">
            {{ t('cv.projects') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UCard v-for="(project, i) in cvProjects" :key="i" variant="subtle" class="break-inside-avoid">
              <div class="space-y-2">
                <h3 class="font-semibold text-base md:text-lg">{{ project.name }}</h3>
                <p class="text-sm md:text-base text-(--ui-text-muted) line-clamp-2">
                  {{ project.description }}
                </p>
                <UButton
                  v-if="project.url"
                  :to="project.url"
                  :label="t('common.visit')"
                  size="md"
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
