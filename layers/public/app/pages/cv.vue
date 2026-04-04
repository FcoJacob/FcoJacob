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
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">
        {{ t('nav.cv') }}
      </h1>
      <UButton
        :label="t('common.download_pdf')"
        icon="i-lucide-download"
        variant="outline"
        :loading="isGenerating"
        @click="handleDownload"
      />
    </div>

    <div ref="cv-content" class="max-w-3xl mx-auto space-y-10">
      <!-- Basics -->
      <section>
        <h2 class="text-2xl font-bold">
          {{ t('cv_data.basics.name') }}
        </h2>
        <p class="text-lg text-(--ui-text-muted)">
          {{ t('cv_data.basics.label') }}
        </p>
        <p class="mt-2">
          {{ t('cv_data.basics.summary') }}
        </p>
        <div class="mt-3 flex flex-wrap gap-3 text-sm text-(--ui-text-muted)">
          <span>fco.j.sarmientoperez@gmail.com</span>
          <span>+34 696124038</span>
          <span>{{ t('cv_data.basics.location') }}</span>
        </div>
        <div class="mt-3 flex gap-2">
          <UButton
            to="https://www.linkedin.com/in/fcojacob/"
            label="LinkedIn"
            size="xs"
            variant="outline"
            target="_blank"
            external
          />
          <UButton
            to="https://github.com/fsarmiento"
            label="GitHub"
            size="xs"
            variant="outline"
            target="_blank"
            external
          />
        </div>
      </section>

      <!-- Work Experience -->
      <section>
        <h2 class="text-xl font-bold mb-4 border-b border-(--ui-border) pb-2">
          {{ t('cv.work') }}
        </h2>
        <div class="space-y-6">
          <div v-for="(job, i) in work" :key="i">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-semibold">
                  {{ job.position }}
                </h3>
                <p class="text-sm text-(--ui-text-muted)">
                  {{ job.name }}
                </p>
              </div>
              <span class="text-sm text-(--ui-text-muted) whitespace-nowrap ml-4">
                {{ job.startDate }} — {{ job.endDate || t('cv.present') }}
              </span>
            </div>
            <p class="mt-2 text-sm">
              {{ job.summary }}
            </p>
            <ul v-if="(job.highlights as string[])?.length" class="mt-1 list-disc list-inside text-sm text-(--ui-text-muted) space-y-0.5">
              <li v-for="h in (job.highlights as string[])" :key="h">
                {{ h }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Education -->
      <section>
        <h2 class="text-xl font-bold mb-4 border-b border-(--ui-border) pb-2">
          {{ t('cv.education') }}
        </h2>
        <div class="space-y-4">
          <div v-for="(edu, i) in education" :key="i">
            <h3 class="font-semibold">
              {{ edu.institution }}
            </h3>
            <p class="text-sm text-(--ui-text-muted)">
              {{ edu.studyType }} — {{ edu.area }}
            </p>
            <p class="text-sm text-(--ui-text-muted)">
              {{ edu.startDate }} — {{ edu.endDate }}
            </p>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section>
        <h2 class="text-xl font-bold mb-4 border-b border-(--ui-border) pb-2">
          {{ t('cv.skills') }}
        </h2>
        <div class="space-y-3">
          <div v-for="key in skillKeys" :key="key">
            <h3 class="font-semibold text-sm">
              {{ t(`cv_data.skills.${key}.name`) }}
              <span class="text-(--ui-text-muted) font-normal">({{ t(`cv_data.skills.${key}.level`) }})</span>
            </h3>
            <div class="flex flex-wrap gap-1 mt-1">
              <UBadge
                v-for="kw in resolveStringArray(`cv_data.skills.${key}.keywords`)"
                :key="kw"
                :label="kw"
                color="neutral"
                size="xs"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Soft Skills -->
      <section>
        <h2 class="text-xl font-bold mb-4 border-b border-(--ui-border) pb-2">
          {{ t('cv.soft_skills') }}
        </h2>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="skill in softSkills" :key="skill" :label="skill" color="neutral" />
        </div>
      </section>

      <!-- Languages -->
      <section>
        <h2 class="text-xl font-bold mb-4 border-b border-(--ui-border) pb-2">
          {{ t('cv.languages') }}
        </h2>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="lang in languages"
            :key="lang.language"
            :label="`${lang.language} — ${lang.fluency}`"
            color="neutral"
          />
        </div>
      </section>

      <!-- Certifications -->
      <section>
        <h2 class="text-xl font-bold mb-4 border-b border-(--ui-border) pb-2">
          {{ t('cv.certifications') }}
        </h2>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="cert in certifications" :key="cert" :label="cert" color="neutral" size="xs" />
        </div>
      </section>

      <!-- Driving -->
      <section>
        <h2 class="text-xl font-bold mb-4 border-b border-(--ui-border) pb-2">
          {{ t('cv.driving') }}
        </h2>
        <p>{{ t('cv_data.driving') }}</p>
      </section>

      <!-- Projects -->
      <section>
        <h2 class="text-xl font-bold mb-4 border-b border-(--ui-border) pb-2">
          {{ t('cv.projects') }}
        </h2>
        <div class="space-y-4">
          <div v-for="(project, i) in projects" :key="i">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold">
                {{ project.name }}
              </h3>
            </div>
            <p class="text-sm text-(--ui-text-muted) mt-1">
              {{ project.description }}
            </p>
            <UButton
              v-if="project.url"
              :to="project.url"
              :label="t('common.visit')"
              size="xs"
              variant="outline"
              class="mt-1"
              target="_blank"
              external
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
