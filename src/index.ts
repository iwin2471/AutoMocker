import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { MockGenerator } from './MockGenerator';

// Load the schema from example.yaml
const fileContents = fs.readFileSync('example.yaml', 'utf8');
const schemaFile = yaml.load(fileContents) as any;

// Access the schema property
const schema = schemaFile.schema;

// Instantiate the MockGenerator with the loaded schema
const mockGenerator = new MockGenerator(schema);

// Generate mock data
const mockData = mockGenerator.generateMockData();

// Ensure the generated folder exists in the root working directory
const generatedFolder = path.join(__dirname, '../generated');
if (!fs.existsSync(generatedFolder)) {
  fs.mkdirSync(generatedFolder);
}

// Save each schema's mock data to a separate JSON file
Object.keys(mockData).forEach((key) => {
  const filePath = path.join(generatedFolder, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(mockData[key], null, 2));
});
