<script setup lang="ts">
type HeadingTag = 'h2' | 'h3' | 'h4'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    name: string
    role: string
    image: string
    gratitudeNote?: string
    authorNote?: string
    nameTag?: HeadingTag
  }>(),
  {
    gratitudeNote: '',
    authorNote: '',
    nameTag: 'h2',
  },
)

const hasGratitudeNote = computed(() => props.gratitudeNote.trim().length > 0)
const hasAuthorNote = computed(() => props.authorNote.trim().length > 0)
</script>

<template>
  <div class="blog-footer-block space-y-6">
    <section v-if="hasGratitudeNote" class="blog-closing-note">
      <p>
        {{ gratitudeNote }}
      </p>
    </section>

    <section class="author-signature">
      <div class="author-signature__media">
        <img :src="image" :alt="name" class="author-signature__photo" />
      </div>

      <div class="author-signature__body">
        <p class="author-signature__eyebrow">
          {{ eyebrow }}
        </p>
        <component :is="nameTag" class="author-signature__name">
          {{ name }}
        </component>
        <p class="author-signature__role">
          {{ role }}
        </p>
        <p v-if="hasAuthorNote" class="author-signature__note">
          {{ authorNote }}
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.blog-footer-block {
  container-type: inline-size;
}

.blog-closing-note {
  padding: 1rem 1.15rem;
  border: 1px solid color-mix(in srgb, var(--ui-border) 82%, transparent);
  border-radius: 1.2rem;
  background: color-mix(in srgb, var(--ui-bg-elevated) 88%, white 12%);
}

.blog-closing-note p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: color-mix(in srgb, var(--ui-text) 88%, var(--ui-text-muted) 12%);
  overflow-wrap: anywhere;
}

.author-signature {
  display: grid;
  grid-template-columns: minmax(0, 140px) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: center;
  padding: 1.35rem;
  border: 1px solid color-mix(in srgb, var(--ui-border) 84%, transparent);
  border-radius: 1.5rem;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ui-bg-elevated) 92%, white 8%),
    var(--ui-bg)
  );
}

.author-signature__media {
  display: flex;
}

.author-signature__body {
  min-width: 0;
}

.author-signature__photo {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 1.15rem;
  filter: saturate(0);
}

.author-signature__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}

.author-signature__name {
  margin: 0;
  font-size: clamp(1.3rem, 1.15rem + 0.4vw, 1.6rem);
  line-height: 1.2;
  font-weight: 800;
  color: var(--ui-text);
}

.author-signature__role {
  margin: 0.35rem 0 0;
  font-size: 0.98rem;
  color: var(--ui-text-dimmed);
  overflow-wrap: anywhere;
}

.author-signature__note {
  margin: 1rem 0 0;
  font-size: 1rem;
  line-height: 1.75;
  color: color-mix(in srgb, var(--ui-text) 88%, var(--ui-text-muted) 12%);
  overflow-wrap: anywhere;
}

@container (max-width: 28rem) {
  .author-signature {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .author-signature__media {
    max-width: 160px;
  }
}

@media (max-width: 640px) {
  .author-signature {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .author-signature__media {
    max-width: 160px;
  }
}
</style>
