/**
 * Curated identifier types for the metadata editor.
 *
 * EPUB refines a dc:identifier with `<meta property="identifier-type"
 * scheme="onix:codelist5">CODE</meta>`, where CODE is an ONIX Code List 5
 * product-identifier code. We store that code in the model and present friendly
 * labels here. An empty value means "no identifier-type" (e.g. a bare UUID).
 */
export interface IdentifierTypeOption {
  value: string; // ONIX Code List 5 code ('' = unspecified)
  label: string;
}

export const IDENTIFIER_TYPE_OPTIONS: IdentifierTypeOption[] = [
  { value: '', label: 'Unspecified' },
  { value: '15', label: 'ISBN' },
  { value: '06', label: 'DOI' },
  { value: '01', label: 'Custom / Proprietary' },
];
