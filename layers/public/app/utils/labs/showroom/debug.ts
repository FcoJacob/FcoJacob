export type ShowroomWheelInputProfile = 'trackpad' | 'magic-mouse' | 'wheel'

export interface ShowroomDebugTuning {
  trackpadMultiplier: number
  magicMouseMultiplier: number
  wheelMultiplier: number
  trackpadMaxDelta: number
  magicMouseMaxDelta: number
  wheelMaxDelta: number
  hysteresisBand: number
  globalZoomScale: number
  compactCurvePower: number
  wideCurvePower: number
  focusDistanceDrift: number
  focusHeightDrift: number
  finalDistanceRelief: number
  finalHeightRelief: number
  finalLookAtLift: number
}

export const defaultShowroomDebugTuning: ShowroomDebugTuning = {
  // Zoom multipliers — must match getProfileMotionConfig() hardcoded zoomMultiplier values
  trackpadMultiplier: 0.0019,
  magicMouseMultiplier: 0.0043,
  wheelMultiplier: 0.0072,
  trackpadMaxDelta: 0.038,
  magicMouseMaxDelta: 0.082,
  wheelMaxDelta: 0.16,
  hysteresisBand: 0.1,
  globalZoomScale: 1.0,
  compactCurvePower: 0.92,
  wideCurvePower: 1.12,
  focusDistanceDrift: 0.28,
  focusHeightDrift: 0.08,
  finalDistanceRelief: 0.62,
  finalHeightRelief: 0.24,
  finalLookAtLift: 0.08,
}

export const showroomTrackpadPreset: ShowroomDebugTuning = {
  ...defaultShowroomDebugTuning,
  trackpadMultiplier: 0.0016,
  trackpadMaxDelta: 0.034,
  hysteresisBand: 0.11,
  compactCurvePower: 0.94,
}

export const showroomMagicMousePreset: ShowroomDebugTuning = {
  ...defaultShowroomDebugTuning,
  magicMouseMultiplier: 0.0049,
  magicMouseMaxDelta: 0.094,
  hysteresisBand: 0.12,
  wideCurvePower: 1.16,
}

export const showroomReviewModePreset: ShowroomDebugTuning = {
  ...defaultShowroomDebugTuning,
  compactCurvePower: 0.88,
  wideCurvePower: 1.04,
  focusDistanceDrift: 0.18,
  focusHeightDrift: 0.05,
  finalDistanceRelief: 0.9,
  finalHeightRelief: 0.28,
  finalLookAtLift: 0.1,
}

export const showroomDebugStorageKeys = {
  magicMouseBaseline: 'showroom-debug-baseline-magic-mouse',
  panelCollapsed: 'showroom-debug-panel-collapsed',
  panelPosition: 'showroom-debug-panel-position',
  trackpadBaseline: 'showroom-debug-baseline-trackpad',
} as const
