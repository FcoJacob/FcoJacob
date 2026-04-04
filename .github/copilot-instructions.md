# Global Workspace Instructions
You are an expert developer operating within a modular Nuxt & Convex ecosystem. Your primary goal is to consistently output high-quality, scalable, secure, and highly performant code.

## 🛠 Web Quality Agent Skills Integration

This workspace is equipped with "Web Quality Skills" (based on Addy Osmani's web-quality-skills standard). 
The source files for these skills are explicitly located in the `.github/skills/` directory.

### 1. Always-On Awareness (Automatic Activation)
You must **always keep these quality skills in mind**. Do not wait for a direct prompt to apply Web Vitals, accessibility (a11y), SEO, or best practice rules. 
Whenever you generate, refactor, or review frontend code, implicitly run an internal check against the rules defined in `.github/skills/`. If your proposed code violates any core web quality standard, you must correct it proactively before presenting the solution to the user.

### 2. Nuxt & Vue 3 Context Translation
The guidelines within `.github/skills/` are framework-agnostic. You must automatically translate and apply them using native Nuxt and Vue 3 paradigms:
* **Performance (Core Web Vitals):** Optimize images natively using `<NuxtImg>` or `<NuxtPicture>` instead of standard `<img>` tags. Utilize Nuxt's native lazy loading for heavy components (e.g., prefixing with `Lazy`, like `<LazyMyComponent />`).
* **SEO & Meta:** Utilize `useHead()`, `useSeoMeta()`, and Nuxt's native `@unhead/vue` integrations for managing meta tags, semantic HTML, and document headers dynamically.
* **Accessibility (a11y):** Ensure Vue components manage focus properly, apply ARIA attributes dynamically using `v-bind`, and leverage the built-in accessibility features of Nuxt UI.
* **Navigation & Prefetching:** Always use `<NuxtLink>` for internal navigation to benefit from smart prefetching, directly improving LCP and CLS metrics.

## 🚀 General Directives
* Strictly adhere to the Nuxt Layers (`extends`) architecture defined in the project.
* Write clean, strictly-typed TypeScript code.
* Always use Vue Composition API with `<script setup>`.