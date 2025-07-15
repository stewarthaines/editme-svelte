<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SpineManagerDemo from './SpineManagerDemo.svelte';

  const { Story } = defineMeta({
    title: 'Components/Content/Spine Manager',
    component: SpineManagerDemo,
    parameters: {
      layout: 'fullscreen',
      docs: {
        description: {
          component:
            'Interactive demonstration of the Spine Item Manager UI for managing EPUB chapter ordering and structure.',
        },
      },
    },
    argTypes: {
      preloadChapters: {
        control: { type: 'boolean' },
        description: 'Whether to pre-populate with sample chapters',
      },
      startCollapsed: {
        control: { type: 'boolean' },
        description: 'Start with sidebar in collapsed state',
      },
      simulateError: {
        control: { type: 'boolean' },
        description: 'Simulate error state for testing error handling',
      },
    },
    tags: ['autodocs'],
  });
</script>

<Story 
  name="Default"
  args={{}}
/>

<Story 
  name="With Chapters"
  args={{
    preloadChapters: true,
  }}
/>

<Story 
  name="Collapsed Sidebar"
  args={{
    preloadChapters: true,
    startCollapsed: true,
  }}
/>

<Story 
  name="Error State"
  args={{
    simulateError: true,
  }}
/>