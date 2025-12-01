// 2. The core function to calculate and set the class
function applyResponsiveClass() {
  // 1. Define breakpoints by name and em-width threshold
  const BREAKPOINTS = [
    { name: 'narrow', limit: 24 },
    { name: 'wide', limit: 34 },
    { name: 'full', limit: Infinity }, // Use 'Infinity' for readability
  ];
  const BODY = document.body;

  // Create a temporary element to measure the current font size (in pixels)
  const tempElement = document.createElement('p');
  BODY.appendChild(tempElement);

  // Calculate the base font size and the viewport width in 'ems'
  const fontSize = parseFloat(window.getComputedStyle(tempElement).fontSize);
  const widthInEms = tempElement.offsetWidth / fontSize;

  // Clean up the temporary element
  tempElement.remove();

  // Find the matching breakpoint (e.g., 'wide' if widthInEms < 34)
  const matchingBreakpoint =
    BREAKPOINTS.find(bp => widthInEms < bp.limit) || BREAKPOINTS[BREAKPOINTS.length - 1];

  // Update the body class list in a single loop
  // This removes all other breakpoint classes and adds only the matching one.
  BREAKPOINTS.forEach(bp => {
    const isMatch = bp.name === matchingBreakpoint.name;
    BODY.classList.toggle(bp.name, isMatch);
  });
}

// 3. Attach the function to both load and resize events
window.addEventListener('load', applyResponsiveClass);
window.addEventListener('resize', applyResponsiveClass);
