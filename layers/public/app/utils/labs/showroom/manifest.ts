export type ShowroomOptionType = 'color' | 'trim' | 'wheels' | 'interior' | 'finish' | 'coating'

export interface ShowroomOption {
  id: string
  label: string
  value: string
}

export interface ShowroomOptionGroup {
  id: string
  label: string
  type: ShowroomOptionType
  options: ShowroomOption[]
}

export interface ShowroomVehicle {
  id: string
  name: string
  model: string
  hero: boolean
  cameraPresets: string[]
  optionGroups: ShowroomOptionGroup[]
}

export interface ShowroomManifest {
  slug: string
  phase: string
  poster: string
  environment: {
    label: string
    hdr: string
    sceneModel?: string
  }
  vehicles: ShowroomVehicle[]
}

export const showroomManifest: ShowroomManifest = {
  slug: 'dealer-showroom',
  phase: 'phase-1',
  poster: '/labs/dealer-showroom/posters/hero-poster.svg',
  environment: {
    label: 'dealer-atrium',
    hdr: '/labs/dealer-showroom/hdr/dealer-atrium-studio.hdr',
  },
  vehicles: [
    {
      id: 'hero-ev-sport',
      name: 'Audi TT RS',
      model: '/labs/dealer-showroom/models/hero-ev-sport.glb',
      hero: true,
      cameraPresets: ['approach', 'focus', 'config-left', 'config-front'],
      optionGroups: [
        {
          id: 'exterior-color',
          label: 'Exterior color',
          type: 'color',
          options: [
            { id: 'graphite', label: 'Graphite', value: '#4a4f57' },
            { id: 'sand', label: 'Sand Pearl', value: '#b8ac96' },
            { id: 'ember', label: 'Ember Copper', value: '#8d4f35' },
            { id: 'ice', label: 'Ice Silver', value: '#c8d0d8' },
            { id: 'white', label: 'Ibis White', value: '#f2f0ea' },
            { id: 'nardo', label: 'Nardo Grey', value: '#8a8f98' },
            { id: 'blue', label: 'Sepang Blue', value: '#1a3b7a' },
            { id: 'red', label: 'Misano Red', value: '#8b1e1e' },
            { id: 'black', label: 'Brilliant Black', value: '#111116' },
          ],
        },
        {
          id: 'satin-tone',
          label: 'Satin tone',
          type: 'finish',
          options: [
            { id: 'gloss', label: 'Gloss', value: 'gloss' },
            { id: 'matte', label: 'Satin / Matte', value: 'matte' },
          ],
        },
        {
          id: 'paint-treatment',
          label: 'Paint treatment',
          type: 'coating',
          options: [
            { id: 'standard', label: 'Standard', value: 'standard' },
            { id: 'ppf', label: 'PPF', value: 'ppf' },
            { id: 'ceramic', label: 'Ceramic Coat', value: 'ceramic' },
          ],
        },
        {
          id: 'trim-package',
          label: 'Trim package',
          type: 'trim',
          options: [
            { id: 'satin', label: 'Satin', value: 'satin' },
            { id: 'shadow', label: 'Shadow', value: 'shadow' },
          ],
        },
        {
          id: 'wheel-set',
          label: 'Wheel set',
          type: 'wheels',
          options: [
            { id: 'stock', label: 'Stock RS', value: 'stock' },
            { id: 'wheel-01', label: 'Sport Spyder 19', value: 'wheel-01' },
            { id: 'wheel-02', label: 'Multi-Spoke 20', value: 'wheel-02' },
            { id: 'wheel-03', label: 'RS Forged 21', value: 'wheel-03' },
          ],
        },
      ],
    },
  ],
}
