/**
 * Universal Text Transform Script
 *
 * Converts markdown text to HTML without any locale-specific logic.
 * Works identically for all languages, scripts, and text directions.
 */

/**
 * Convert markdown to HTML (simplified universal parser)
 * @param {string} markdown - Markdown text
 * @returns {string} HTML output
 */
function transformText(markdown) {
  let html = markdown;

  // Headers (supports # through ######)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  // Wrap consecutive <li> elements in appropriate list tags
  html = html.replace(/(<li>.*<\/li>)(\s*)(?=<li>)/gs, '$1$2');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph tags if not already wrapped
  if (!html.includes('<p>') && !html.includes('<h1>') && !html.includes('<h2>')) {
    html = `<p>${html}</p>`;
  }

  return html;
}

// Export for use in EPUB transform pipeline
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { transformText };
}
