import fs from 'fs';
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

// Output the generated mock data
console.log(JSON.stringify(mockData, null, 2));
