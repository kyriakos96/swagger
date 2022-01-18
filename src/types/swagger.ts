export interface Contact {
  name?: string;
  email?: string;
  url?: string;
}

export interface License {
  name: string;
  url?: string;
}

export interface Info {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version?: string;
}

export interface Server {
  url: string;
  description: string;
}

export interface ParameterSchema {
  $ref?: string;
  format?: string;
  items?: { type: string };
  type?: string;
}

export interface Parameter {
  name: string;
  in: string;
  description: string;
  required: boolean;
  style: string;
  explode: boolean;
  schema: ParameterSchema;
}

export interface ExternalDocs {
  description?: string;
  url: string;
}

export interface ResponseValue {
  description?: string;
  headers?: { [key: string]: ParameterSchema };
  examples?: unknown;
  content?: {
    [key: string]: {
      schema?: SchemaValue;
    };
  };
}

export interface Response {
  [key: string]: ResponseValue;
}
export interface Security {
  [key: string]: string[];
}
export interface RequestBody {
  content: {
    [key: string]: {
      schema: {
        $ref: string;
      };
    };
  };
}

export interface EndpointMethodValues {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocs;
  operationId?: string;
  consumes?: string[];
  produces?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Response;
  schemes?: string[];
  deprecated?: boolean;
  security?: Security[];
}

export interface EndpointMethod {
  [key: string]: EndpointMethodValues;
}

export interface Path {
  [key: string]: EndpointMethod;
}

export interface SchemaValue {
  type?: string;
  $ref?: string;
  required?: string[];
  properties?: {
    [key: string]: {
      $ref?: string;
      type?: string;
      example?: any;
      format?: string;
      items?: any;
    };
  };
  example?: any;
}

export interface Schemas {
  [key: string]: SchemaValue;
}
export interface Components {
  schemas: Schemas;
}

export interface Swagger {
  openapi: string;
  info: Info;
  servers: Server[];
  paths: Path;
  components: Components;
}
