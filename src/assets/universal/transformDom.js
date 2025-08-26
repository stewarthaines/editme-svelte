/**
 * Transform DOM by adding IDs to H2 headings for navigation
 * @param {Document} htmlDocument - HTML document to transform
 * @param {string|undefined} idref - Spine item idref for context-aware transforms
 */
function transformDOM(htmlDocument, idref) {
  try {
    // Find all H2 elements in the document
    const h2Elements = htmlDocument.querySelectorAll('h2');

    h2Elements.forEach((h2, index) => {
      // Skip if already has an ID
      if (h2.getAttribute('id')) {
        return;
      }

      // Generate ID from text content or use fallback
      const text = h2.textContent || '';
      let id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 50); // Limit length

      // Fallback if no usable text
      if (!id) {
        id = `heading-${index + 1}`;
      }

      // Ensure ID is unique in document
      let finalId = id;
      let counter = 1;
      while (htmlDocument.getElementById(finalId)) {
        finalId = `${id}-${counter}`;
        counter++;
      }

      // Set the ID attribute
      h2.setAttribute('id', finalId);
    });
  } catch (error) {
    console.error('DOM transform error:', error);
  }
}
