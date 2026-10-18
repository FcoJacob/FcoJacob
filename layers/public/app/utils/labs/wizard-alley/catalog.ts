/**
 * Static catalog for the Wizard Alley lab.
 *
 * Everything in the scene is generated procedurally from this file: there are
 * no external models, textures or fonts. Labels are i18n keys resolved by the
 * shell so the catalog stays locale-agnostic.
 */

export type AlleySlot = 'head' | 'cloak' | 'wand'
export type AlleySide = 'left' | 'right'

export interface AlleyItem {
  id: string
  slot: AlleySlot
  /** i18n key under `labs_alley.items` */
  labelKey: string
  /** i18n key under `labs_alley.items` */
  descriptionKey: string
  /** Main material colour (hat felt, cloak velvet, wand wood). */
  primary: string
  /** Secondary colour (band, trim, handle). */
  accent: string
  /** Colour of the spark burst when the item is tried on. */
  spark: string
  /** Builder variant so the item factory can shape each piece differently. */
  variant: string
}

export interface AlleyShop {
  id: string
  slot: AlleySlot
  side: AlleySide
  /** Position along the alley (negative z = deeper). */
  z: number
  /** i18n key under `labs_alley.shops` */
  nameKey: string
  /** i18n key under `labs_alley.shops` */
  taglineKey: string
  /** Sign + window glow colour. */
  accent: string
  /** Text painted on the hanging sign (kept short so it fits the plank). */
  signText: string
  items: AlleyItem[]
}

/** Alley runs from z = 0 (entrance) to z = -ALLEY_LENGTH (the far gate). */
export const ALLEY_LENGTH = 62
/** Distance between the two building rows (x = ±ALLEY_HALF_WIDTH). */
export const ALLEY_HALF_WIDTH = 4.6
/** How close (in metres along z) the avatar must be to a shop to get the prompt. */
export const SHOP_PROMPT_RANGE = 3.2

export const alleyShops: AlleyShop[] = [
  {
    id: 'hats',
    slot: 'head',
    side: 'left',
    z: -16,
    nameKey: 'hats_name',
    taglineKey: 'hats_tagline',
    accent: '#c99a4b',
    signText: 'Sombreros',
    items: [
      {
        id: 'hat-midnight',
        slot: 'head',
        labelKey: 'hat_midnight',
        descriptionKey: 'hat_midnight_description',
        primary: '#1d2033',
        accent: '#8c6a2f',
        spark: '#ffd27a',
        variant: 'pointed',
      },
      {
        id: 'hat-plum',
        slot: 'head',
        labelKey: 'hat_plum',
        descriptionKey: 'hat_plum_description',
        primary: '#4b1f4e',
        accent: '#d8b45a',
        spark: '#e39bff',
        variant: 'crooked',
      },
      {
        id: 'hat-moss',
        slot: 'head',
        labelKey: 'hat_moss',
        descriptionKey: 'hat_moss_description',
        primary: '#2f4a2b',
        accent: '#b58b45',
        spark: '#9cf2a8',
        variant: 'wide',
      },
    ],
  },
  {
    id: 'cloaks',
    slot: 'cloak',
    side: 'right',
    z: -31,
    nameKey: 'cloaks_name',
    taglineKey: 'cloaks_tagline',
    accent: '#8f3b4a',
    signText: 'Capas',
    items: [
      {
        id: 'cloak-raven',
        slot: 'cloak',
        labelKey: 'cloak_raven',
        descriptionKey: 'cloak_raven_description',
        primary: '#14151c',
        accent: '#5c5f73',
        spark: '#b8c4ff',
        variant: 'plain',
      },
      {
        id: 'cloak-crimson',
        slot: 'cloak',
        labelKey: 'cloak_crimson',
        descriptionKey: 'cloak_crimson_description',
        primary: '#6a1b24',
        accent: '#d9a441',
        spark: '#ff9a7a',
        variant: 'trim',
      },
      {
        id: 'cloak-emerald',
        slot: 'cloak',
        labelKey: 'cloak_emerald',
        descriptionKey: 'cloak_emerald_description',
        primary: '#163d2e',
        accent: '#c5a24a',
        spark: '#8affc6',
        variant: 'clasp',
      },
    ],
  },
  {
    id: 'wands',
    slot: 'wand',
    side: 'left',
    z: -47,
    nameKey: 'wands_name',
    taglineKey: 'wands_tagline',
    accent: '#e0b35a',
    signText: 'Varitas',
    items: [
      {
        id: 'wand-holly',
        slot: 'wand',
        labelKey: 'wand_holly',
        descriptionKey: 'wand_holly_description',
        primary: '#b98a5a',
        accent: '#6b4a2b',
        spark: '#ffcf5a',
        variant: 'holly',
      },
      {
        id: 'wand-elder',
        slot: 'wand',
        labelKey: 'wand_elder',
        descriptionKey: 'wand_elder_description',
        primary: '#3a2d26',
        accent: '#d9d9e6',
        spark: '#e6f0ff',
        variant: 'elder',
      },
      {
        id: 'wand-vine',
        slot: 'wand',
        labelKey: 'wand_vine',
        descriptionKey: 'wand_vine_description',
        primary: '#7b5a3c',
        accent: '#3f7a4a',
        spark: '#7dffb0',
        variant: 'vine',
      },
    ],
  },
]

export function findAlleyItem(itemId: string): AlleyItem | null {
  for (const shop of alleyShops) {
    const item = shop.items.find((entry) => entry.id === itemId)
    if (item) {
      return item
    }
  }
  return null
}

export function findAlleyShop(shopId: string): AlleyShop | null {
  return alleyShops.find((shop) => shop.id === shopId) ?? null
}
