<script lang="ts">
  import type { ValidationReport } from '../epub-validation.js';

  let {
    report,
    show,
    onClose,
  }: {
    report: ValidationReport | null;
    show: boolean;
    onClose: () => void;
  } = $props();
</script>

{#if show && report}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="modal-header">
        <h3>Validation Report: {report.filename}</h3>
        <button class="btn-close" onclick={onClose}>✕</button>
      </div>
      <div class="modal-body">
        <div class="report-summary">
          <p>
            <strong>Status:</strong>
            <span class={report.isValid ? 'status-valid' : 'status-invalid'}>
              {report.isValid ? 'Valid' : 'Invalid'}
            </span>
          </p>
          <p>
            <strong>Errors:</strong>
            {report.errorCount} |
            <strong>Warnings:</strong>
            {report.warningCount}
          </p>
          <p>
            <strong>Checked:</strong>
            {new Date(report.timestamp).toLocaleString()}
          </p>
        </div>

        <div class="report-messages">
          {#each report.messages as msg, i (i)}
            <div
              class="message"
              class:error={msg.level === 'error'}
              class:warning={msg.level === 'warning'}
            >
              <span class="level">{msg.level.toUpperCase()}</span>
              {#if msg.location}
                <span class="location">{msg.location}</span>
              {/if}
              <p>{msg.message}</p>
            </div>
          {/each}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" onclick={onClose}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 16px;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .report-summary {
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f8f8;
    border-radius: 4px;
  }

  .report-summary p {
    margin: 4px 0;
    font-size: 13px;
  }

  .report-messages {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .message {
    padding: 12px;
    border-left: 4px solid #ddd;
    border-radius: 2px;
    font-size: 12px;
  }

  .message.error {
    background: #ffebee;
    border-left-color: #f44336;
  }

  .message.warning {
    background: #fff3e0;
    border-left-color: #ff9800;
  }

  .message .level {
    font-weight: bold;
    font-size: 11px;
    color: #666;
    margin-right: 8px;
  }

  .message .location {
    color: #999;
    font-size: 11px;
    margin-right: 8px;
  }

  .message p {
    margin: 4px 0 0 0;
  }

  .modal-footer {
    padding: 12px 16px;
    border-top: 1px solid #e0e0e0;
    text-align: right;
  }
</style>
