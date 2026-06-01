/**
 * Controlled vocabularies for EPUB accessibility metadata.
 *
 * Values are the canonical Schema.org / W3C accessibility discovery tokens
 * (case-sensitive) used as `<meta property="schema:…">` content; labels are
 * human-facing. Conformance strings follow EPUB Accessibility 1.1.
 *
 * Sources:
 *  - https://w3c.github.io/a11y-discov-vocab/latest/
 *  - https://kb.daisy.org/publishing/docs/metadata/schema.org/
 *  - https://www.w3.org/TR/epub-a11y-11/
 */

export interface VocabOption {
  value: string;
  label: string;
}

/** Sensory modality required to consume the content (schema:accessMode). */
export const ACCESS_MODES: VocabOption[] = [
  { value: 'textual', label: 'Textual' },
  { value: 'visual', label: 'Visual' },
  { value: 'auditory', label: 'Auditory' },
  { value: 'tactile', label: 'Tactile' },
];

/** Accessibility features present (schema:accessibilityFeature). */
export const ACCESSIBILITY_FEATURES: VocabOption[] = [
  { value: 'structuralNavigation', label: 'Structural navigation' },
  { value: 'tableOfContents', label: 'Table of contents' },
  { value: 'readingOrder', label: 'Reading order' },
  { value: 'alternativeText', label: 'Alternative text' },
  { value: 'longDescription', label: 'Long descriptions' },
  { value: 'displayTransformability', label: 'Display transformability' },
  { value: 'printPageNumbers', label: 'Print page numbers' },
  { value: 'pageNavigation', label: 'Page navigation' },
  { value: 'pageBreakMarkers', label: 'Page break markers' },
  { value: 'index', label: 'Index' },
  { value: 'MathML', label: 'MathML' },
  { value: 'describedMath', label: 'Described math' },
  { value: 'rubyAnnotations', label: 'Ruby annotations' },
  { value: 'synchronizedAudioText', label: 'Synchronized audio + text' },
  { value: 'ttsMarkup', label: 'Text-to-speech markup' },
  { value: 'highContrastDisplay', label: 'High-contrast display' },
  { value: 'largePrint', label: 'Large print' },
  { value: 'braille', label: 'Braille' },
  { value: 'tactileGraphic', label: 'Tactile graphics' },
  { value: 'signLanguage', label: 'Sign language' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'audioDescription', label: 'Audio description' },
  { value: 'ARIA', label: 'ARIA' },
  { value: 'unlocked', label: 'No DRM (unlocked)' },
  { value: 'none', label: 'None' },
];

/** Accessibility hazards (schema:accessibilityHazard). */
export const ACCESSIBILITY_HAZARDS: VocabOption[] = [
  { value: 'none', label: 'None' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'flashing', label: 'Flashing' },
  { value: 'noFlashingHazard', label: 'No flashing hazard' },
  { value: 'sound', label: 'Sound' },
  { value: 'noSoundHazard', label: 'No sound hazard' },
  { value: 'motionSimulation', label: 'Motion simulation' },
  { value: 'noMotionSimulationHazard', label: 'No motion-simulation hazard' },
];

/** How the user can control the content (schema:accessibilityControl). */
export const ACCESSIBILITY_CONTROLS: VocabOption[] = [
  { value: 'fullKeyboardControl', label: 'Full keyboard control' },
  { value: 'fullMouseControl', label: 'Full mouse control' },
  { value: 'fullTouchControl', label: 'Full touch control' },
  { value: 'fullSwitchControl', label: 'Full switch control' },
  { value: 'fullVideoControl', label: 'Full video control' },
  { value: 'fullAudioControl', label: 'Full audio control' },
];

/** Accessibility APIs the content is compatible with (schema:accessibilityAPI). */
export const ACCESSIBILITY_APIS: VocabOption[] = [{ value: 'ARIA', label: 'ARIA' }];

/**
 * EPUB Accessibility 1.1 conformance strings (dcterms:conformsTo). Empty value
 * = no conformance declared.
 */
export const CONFORMANCE_OPTIONS: VocabOption[] = [
  { value: '', label: 'Not declared' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.0 Level A', label: 'WCAG 2.0 — Level A' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.0 Level AA', label: 'WCAG 2.0 — Level AA' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.0 Level AAA', label: 'WCAG 2.0 — Level AAA' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.1 Level A', label: 'WCAG 2.1 — Level A' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.1 Level AA', label: 'WCAG 2.1 — Level AA' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.1 Level AAA', label: 'WCAG 2.1 — Level AAA' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.2 Level A', label: 'WCAG 2.2 — Level A' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.2 Level AA', label: 'WCAG 2.2 — Level AA' },
  { value: 'EPUB Accessibility 1.1 - WCAG 2.2 Level AAA', label: 'WCAG 2.2 — Level AAA' },
];
