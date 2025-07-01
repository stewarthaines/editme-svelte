/// <reference types="svelte" />
/// <reference types="vite/client" />

// Support for importing files as raw strings
declare module '*.js?raw' {
  const content: string;
  export default content;
}

declare module '*.ts?raw' {
  const content: string;
  export default content;
}

// Global types for internationalization
declare global {
  interface Window {
    __EDITME_TRANSLATIONS_ZIP__?: string;
  }
}
