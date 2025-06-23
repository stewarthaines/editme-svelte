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
