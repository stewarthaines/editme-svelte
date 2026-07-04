<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import App from '../App.svelte';
  import { seedProject } from './utils/seed-project';

  const { Story } = defineMeta({
    title: 'Application/Internationalization (i18n)',
    component: App,
    parameters: {
      layout: 'fullscreen',
      docs: {
        description: {
          component:
            'Internationalization on a seeded project: switch languages with the locale selector in the Storybook toolbar (🌍 icon). Shipped locales are English and German; the RTL story shows the layout flip for Arabic.',
        },
      },
    },
  });
</script>

<Story
  name="Language Switching Demo"
  loaders={[
    async () => ({ seeded: await seedProject({ title: 'i18n Demo Book', view: 'spine' }) }),
  ]}
  parameters={{
    docs: {
      description: {
        story:
          '🌍 Tour the project views on a seeded book, then switch locale in the toolbar — navigation labels, view headings, and form text are all translated.',
      },
    },
  }}
  play={async ({ canvas, userEvent }) => {
    await canvas.findByText('i18n Demo Book', {}, { timeout: 30000 });

    for (const section of ['Metadata', 'Manifest', 'Navigation']) {
      const button = await canvas.findByRole('button', { name: section }, { timeout: 20000 });
      await userEvent.click(button);
      await canvas.findByRole('heading', { name: new RegExp(section, 'i') }, { timeout: 20000 });
    }
  }}
>
  <App />
</Story>

<Story
  name="RTL Layout Demo"
  loaders={[
    async () => ({ seeded: await seedProject({ title: 'RTL Demo Book', view: 'spine' }) }),
  ]}
  parameters={{
    docs: {
      description: {
        story:
          '📱 Right-to-left layout: this story defaults the locale to Arabic — the sidebar moves to the right and text alignment flips. Toggle the sidebar to see RTL positioning.',
      },
    },
    globals: {
      locale: 'ar',
    },
  }}
  play={async ({ canvas, userEvent }) => {
    await canvas.findByText('RTL Demo Book', {}, { timeout: 30000 });

    // Collapse and expand the sidebar to show RTL positioning.
    const toggleButton = await canvas.findByLabelText(/Toggle sidebar/i, {}, { timeout: 20000 });
    await userEvent.click(toggleButton);
    await userEvent.click(toggleButton);
  }}
>
  <App />
</Story>
