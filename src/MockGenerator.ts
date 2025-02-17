import { faker } from '@faker-js/faker';

export enum DataType {
  LIST = 'list',
  NUMBER = 'number',
  STRING = 'string',
  OBJECT = 'object',
  BOOLEAN = 'boolean',
}

interface Schema {
  type: DataType;
  count?: number;
  properties?: { [key: string]: Schema };
  items?: Schema;
  mock?: string;
  relation?: string;
}

type SchemaFileType = { [key: string]: Schema | string };

export class MockGenerator {
  private schemaFile: SchemaFileType;
  private mockData: any;

  constructor(schemaFile: SchemaFileType) {
    this.schemaFile = schemaFile;
    this.mockData = {};
  }

  private generateMockDataFromSchema(schema: Schema): any {
    switch (schema.type) {
      case DataType.LIST:
        return this.generateList(schema);
      case DataType.NUMBER:
        return faker.number.int();
      case DataType.STRING:
        return this.generateString(schema);
      case DataType.BOOLEAN:
        return faker.datatype.boolean();
      case DataType.OBJECT:
        return this.generateObject(schema);
      default:
        return null;
    }
  }

  private generateList(schema: Schema): any[] {
    return Array.from({ length: schema.count ?? 0 }, () => {
      if (schema.items) {
        return this.generateMockDataFromSchema(schema.items);
      } else {
        const item: any = {};
        for (const key in schema.properties) {
          item[key] = this.generateMockDataFromSchema(schema.properties[key]);
        }
        return item;
      }
    });
  }

  private generateString(schema: Schema): string {
    switch (schema.mock) {
      case 'name':
        return faker.person.fullName({ sex: faker.helpers.arrayElement(["female", "male"]) });
      case 'word':
        return faker.word.noun();
      case 'sentence':
        return faker.lorem.sentence();
      case 'paragraph':
        return faker.lorem.paragraph();
      default:
        return faker.lorem.word();
    }
  }

  private generateObject(schema: Schema): any {
    const obj: any = {};
    for (const key in schema.properties) {
      obj[key] = this.generateMockDataFromSchema(schema.properties[key]);
    }
    return obj;
  }

  private dependencyResolver(schema: SchemaFileType): string[] {
    const ranking: { [key: string]: number } = {};
    const visited: { [key: string]: boolean } = {};

    const visit = (key: string, depth: number) => {
      if (visited[key]) return;
      visited[key] = true;
      const currentSchema = schema[key] as Schema;
      if (currentSchema.properties) {
        for (const prop in currentSchema.properties) {
          const propSchema = currentSchema.properties[prop];
          if (propSchema.relation) {
            const relatedKey = propSchema.relation.split('.')[0];
            visit(relatedKey, depth + 1);
          }
        }
      }
      ranking[key] = depth;
    };

    for (const key in schema) {
      if (typeof schema[key] === 'string') continue;
      visit(key, 0);
    }

    return Object.keys(ranking).sort((a, b) => ranking[a] - ranking[b]);
  }

  public generateMockData(): any {
    const rankedSchemas = this.dependencyResolver(this.schemaFile);
    for (const key of rankedSchemas) {
      const schema = this.schemaFile[key] as Schema;
      this.mockData[key] = this.generateMockDataFromSchema(schema);
    }

    this.populateRelationalFields(rankedSchemas);

    return this.mockData;
  }

  private populateRelationalFields(rankedSchemas: string[]): void {
    for (const key of rankedSchemas) {
      const schema = this.schemaFile[key] as Schema;
      if (schema.properties == null) continue;

      for (const prop in schema.properties) {
        const propSchema = schema.properties[prop];
        if (propSchema.relation == null) continue;
        const relatedKey = propSchema.relation.split('.')[0];
        const relatedField = propSchema.relation.split('.')[1];
        this.mockData[key].forEach((item: any) => {
          const relatedData = this.mockData[relatedKey] as any[];
          item[prop] = faker.helpers.arrayElement(relatedData)[relatedField];
        });

      }

    }
  }
}
