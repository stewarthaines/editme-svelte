<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SourceZipDemo from './SourceZipDemo.svelte';

  const { Story } = defineMeta({
    title: 'Backend/SOURCE.zip Management',
    component: SourceZipDemo,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: `
# SOURCE.zip Management Demo

Interactive demonstration of the SOURCE.zip management system for EPUB workspaces.

## Features Demonstrated

### Core Operations
- **SOURCE.zip Creation**: Bundle workspace SOURCE/ directory files into a ZIP archive
- **SOURCE.zip Extraction**: Extract ZIP contents back to workspace SOURCE/ directory
- **Structure Validation**: Validate SOURCE/ directory integrity and format
- **File Classification**: Automatic categorization of files by type (settings/text/script/extension/other)

### File Management
- **Directory Statistics**: Real-time stats on file counts, sizes, and structure
- **File Listing**: Detailed view of all SOURCE/ files with metadata
- **Structure Initialization**: Create default SOURCE/ directory layout
- **Upload/Download**: Browser-based file operations

### Integration Features
- **Real Browser APIs**: Uses actual File Storage API and ZIP operations
- **Error Handling**: Comprehensive error reporting and recovery
- **State Management**: Persistent workspace state throughout demo
- **Progress Monitoring**: Real-time logging of all operations

## Usage Instructions

1. **Initialize**: Demo automatically creates a workspace with sample SOURCE/ content
2. **Explore Files**: View SOURCE/ directory structure and file statistics
3. **Create ZIP**: Bundle SOURCE/ files into downloadable SOURCE.zip
4. **Upload ZIP**: Select and extract a SOURCE.zip file to workspace
5. **Validate**: Check SOURCE/ directory structure and format compliance
6. **Reset**: Clear workspace and start fresh demo

## Technical Implementation

- **Storage Backend**: Uses browser-native File Storage API (OPFS/IndexedDB)
- **ZIP Operations**: Browser-native ZIP creation/extraction without external dependencies
- **Security**: Path validation prevents directory traversal attacks
- **Performance**: Efficient in-memory operations with progress feedback
- **Compatibility**: Works across modern browsers with fallback support

## File Type Classification

- **Settings**: \`settings.json\` configuration files
- **Text**: Source content files in \`text/\` directory
- **Script**: Transform scripts in \`scripts/\` directory  
- **Extension**: Plugin files in \`extensions/\` directory
- **Other**: System files like \`.gitkeep\` and miscellaneous content

This demo showcases the complete SOURCE.zip workflow used in EPUB packaging/unpacking operations.
        `
        }
      }
    }
  });
</script>

<!-- Basic interactive demo -->
<Story name="Interactive Demo">
  <SourceZipDemo />
</Story>

<!-- Automated demo with sample operations -->
<Story
  name="Automated Demo"
  play={async ({ canvasElement }) => {
    const { within } = await import('@testing-library/dom');
    const { default: userEvent } = await import('@testing-library/user-event');

    const canvas = within(canvasElement);
    const user = userEvent.setup();

    try {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh source info to populate file list
      const refreshButton = canvas.getByText('🔄 Refresh Info');
      await user.click(refreshButton);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate the SOURCE/ structure
      const validateButton = canvas.getByText('✅ Validate Structure');
      await user.click(validateButton);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a SOURCE.zip (this will trigger download)
      const createZipButton = canvas.getByText('📦 Create SOURCE.zip');
      await user.click(createZipButton);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clear logs to show clean final state
      const clearLogsButton = canvas.getByText('🧹 Clear Logs');
      await user.click(clearLogsButton);
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log('SOURCE.zip demo play function failed:', error);
      // Continue to show current state
    }
  }}
>
  <SourceZipDemo />
</Story>

<!-- Demo with workflow demonstration -->
<Story
  name="Complete Workflow"
  play={async ({ canvasElement }) => {
    const { within } = await import('@testing-library/dom');
    const { default: userEvent } = await import('@testing-library/user-event');

    const canvas = within(canvasElement);
    const user = userEvent.setup();

    try {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 1: Show current state
      const refreshButton = canvas.getByText('🔄 Refresh Info');
      await user.click(refreshButton);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Validate structure
      const validateButton = canvas.getByText('✅ Validate Structure');
      await user.click(validateButton);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Create SOURCE.zip
      const createZipButton = canvas.getByText('📦 Create SOURCE.zip');
      await user.click(createZipButton);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 4: Reset to clean state
      const resetButton = canvas.getByText('🔄 Reset Demo');
      await user.click(resetButton);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 5: Show new workspace state
      await user.click(refreshButton);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 6: Final validation
      await user.click(validateButton);
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log('SOURCE.zip workflow demo failed:', error);
    }
  }}
>
  <SourceZipDemo />
</Story>