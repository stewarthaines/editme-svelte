import { mount } from 'svelte';
import './styles/index.css';
import App from './App.svelte';
import { initI18n } from './lib/i18n';

// Initialize i18n system
initI18n().catch(error => {
  console.error('Failed to initialize i18n:', error);
});

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
