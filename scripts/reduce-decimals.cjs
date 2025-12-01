const fs = require('fs');
const path = require('path');

/**
 * Recursively traverses an object or array and reduces all numeric values
 * to a specified number of decimal places.
 *
 * @param {object|array} data - The object or array to traverse.
 * @param {number} precision - The number of decimal places to keep.
 */
function traverseAndReduce(data, precision = 3) {
  if (typeof data === 'object' && data !== null) {
    // Handle Arrays and Objects
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const value = data[key];

        if (typeof value === 'number') {
          // Round and convert back to a number
          data[key] = parseFloat(value.toFixed(precision));
        } else if (typeof value === 'object') {
          // Recurse for nested objects and arrays
          traverseAndReduce(value, precision);
        }
      }
    }
  }
}

/**
 * Main function to load, process, and save the JSON data.
 * The input file path is derived from command-line arguments.
 *
 * @param {number} precision - The number of decimal places to keep.
 */
function reduceJsonDecimalsCLI(precision = 3) {
  // Process command-line arguments
  // process.argv[0] is 'node'
  // process.argv[1] is the script path
  // process.argv[2] is the first argument (the input filename)
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error('❌ Error: Please provide the input JSON filename as an argument.');
    console.log('\nUsage: node reduce_decimals_cli.js <input_file.json>');
    process.exit(1);
  }

  // Generate the output filename
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const baseName = path.basename(inputPath, ext);
  const outputPath = path.join(dir, `${baseName}_reduced${ext}`);

  // Check if the input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: Input file not found at ${inputPath}`);
    process.exit(1);
  }

  try {
    console.log(`Reading data from: ${inputPath}`);

    // 1. Read the raw JSON file content
    const rawData = fs.readFileSync(inputPath, 'utf8');

    // 2. Parse the JSON string into a JavaScript object
    const data = JSON.parse(rawData);

    // 3. Process the data
    traverseAndReduce(data, precision);

    console.log(`Processing complete. Saving to: ${outputPath}`);

    // 4. Stringify the object back into JSON (pretty-printed with 2 spaces)
    const reducedJson = JSON.stringify(data);

    // 5. Write the result to the output file
    fs.writeFileSync(outputPath, reducedJson);

    console.log('✅ Success! Decimals reduced and file saved.');
  } catch (error) {
    console.error('❌ An error occurred:', error.message);
    if (error instanceof SyntaxError) {
      console.error('Check if your input file contains valid JSON.');
    }
    process.exit(1);
  }
}

// --- Execution ---
const DECIMAL_PLACES = 3;

// Run the script
reduceJsonDecimalsCLI(DECIMAL_PLACES);
