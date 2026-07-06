'use strict';

const SUPPORTED_SCHEMA_KEYWORDS = [
  '$ref',
  'type',
  'enum',
  'const',
  'required',
  'properties',
  'items',
  'contains',
  'additionalProperties',
  'anyOf',
  'oneOf',
  'allOf',
  'if',
  'then',
  'else',
  'minItems',
  'maxItems',
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
];

function getExpectedTypes(schema) {
  if (!schema.type) return [];
  return Array.isArray(schema.type) ? schema.type : [schema.type];
}

function schemaAllowsType(schema, typeName) {
  return getExpectedTypes(schema).includes(typeName);
}

function schemaHasObjectConstraints(schema) {
  return (
    schemaAllowsType(schema, 'object')
    || Array.isArray(schema.required)
    || (schema.properties && typeof schema.properties === 'object')
    || Object.prototype.hasOwnProperty.call(schema, 'additionalProperties')
  );
}

function validateAgainstSchema(schema, value, pointer = 'root', errors = [], rootSchema = schema, refStack = []) {
  if (!schema || typeof schema !== 'object') {
    return { valid: false, errors: [`${pointer}: missing schema`] };
  }

  if (typeof schema.$ref === 'string') {
    const ref = resolveLocalRef(rootSchema, schema.$ref);
    if (!ref.ok) {
      errors.push(`${pointer}: unsupported schema ref ${schema.$ref}`);
      return { valid: false, errors };
    }
    if (refStack.includes(schema.$ref)) {
      errors.push(`${pointer}: circular schema ref ${schema.$ref}`);
      return { valid: false, errors };
    }
    validateAgainstSchema(ref.schema, value, pointer, errors, rootSchema, [...refStack, schema.$ref]);
  }

  if (Array.isArray(schema.allOf)) {
    for (const childSchema of schema.allOf) {
      validateAgainstSchema(childSchema, value, pointer, errors, rootSchema, refStack);
    }
  }

  if (Array.isArray(schema.anyOf)) {
    const matches = schema.anyOf
      .map((childSchema) => validateAgainstSchema(childSchema, value, pointer, [], rootSchema, refStack))
      .filter((result) => result.valid);
    if (matches.length === 0) {
      errors.push(`${pointer}: value did not match anyOf`);
    }
  }

  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf
      .map((childSchema) => validateAgainstSchema(childSchema, value, pointer, [], rootSchema, refStack))
      .filter((result) => result.valid);
    if (matches.length !== 1) {
      errors.push(`${pointer}: value matched ${matches.length} oneOf schemas`);
    }
  }

  if (schema.if && typeof schema.if === 'object') {
    const condition = validateAgainstSchema(schema.if, value, pointer, [], rootSchema, refStack);
    if (condition.valid && schema.then && typeof schema.then === 'object') {
      validateAgainstSchema(schema.then, value, pointer, errors, rootSchema, refStack);
    }
    if (!condition.valid && schema.else && typeof schema.else === 'object') {
      validateAgainstSchema(schema.else, value, pointer, errors, rootSchema, refStack);
    }
  }

  const expectedTypes = getExpectedTypes(schema);
  if (expectedTypes.length > 0) {
    const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    const typeMatches = expectedTypes.some((typeName) => {
      if (typeName === 'number') return typeof value === 'number' && Number.isFinite(value);
      if (typeName === 'integer') return Number.isInteger(value);
      if (typeName === 'array') return Array.isArray(value);
      if (typeName === 'object') return value && typeof value === 'object' && !Array.isArray(value);
      if (typeName === 'null') return value === null;
      return actualType === typeName;
    });
    if (!typeMatches) {
      errors.push(`${pointer}: expected ${expectedTypes.join('|')}, received ${actualType}`);
      return { valid: false, errors };
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${pointer}: value ${JSON.stringify(value)} not in enum`);
  }

  if (Object.prototype.hasOwnProperty.call(schema, 'const') && value !== schema.const) {
    errors.push(`${pointer}: value ${JSON.stringify(value)} does not equal const ${JSON.stringify(schema.const)}`);
  }

  // 对象级约束(required/properties/additionalProperties)只要 value 是普通对象就执行,
  // 不以显式 type:object 为前提——否则省略 type 的合法子 schema 会静默放行缺失的 required 字段。
  if (schemaHasObjectConstraints(schema) && value && typeof value === 'object' && !Array.isArray(value)) {
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${pointer}: missing required key ${key}`);
      }
    }

    const properties = schema.properties || {};
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validateAgainstSchema(propertySchema, value[key], `${pointer}.${key}`, errors, rootSchema, refStack);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${pointer}.${key}: unexpected additional key`);
        }
      }
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          validateAgainstSchema(schema.additionalProperties, child, `${pointer}.${key}`, errors, rootSchema, refStack);
        }
      }
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      validateAgainstSchema(schema.items, item, `${pointer}[${index}]`, errors, rootSchema, refStack);
    });
  }

  if (Array.isArray(value)) {
    if (schema.contains && typeof schema.contains === 'object') {
      const hasMatch = value.some((item, index) =>
        validateAgainstSchema(schema.contains, item, `${pointer}[${index}]`, [], rootSchema, refStack).valid
      );
      if (!hasMatch) {
        errors.push(`${pointer}: expected array to contain matching item`);
      }
    }
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
      errors.push(`${pointer}: expected at least ${schema.minItems} item(s), received ${value.length}`);
    }
    if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) {
      errors.push(`${pointer}: expected at most ${schema.maxItems} item(s), received ${value.length}`);
    }
  }

  if (schemaAllowsType(schema, 'string') && typeof value === 'string') {
    if (Number.isInteger(schema.minLength) && value.length < schema.minLength) {
      errors.push(`${pointer}: expected string length at least ${schema.minLength}, received ${value.length}`);
    }
    if (Number.isInteger(schema.maxLength) && value.length > schema.maxLength) {
      errors.push(`${pointer}: expected string length at most ${schema.maxLength}, received ${value.length}`);
    }
    if (typeof schema.pattern === 'string' && !(new RegExp(schema.pattern).test(value))) {
      errors.push(`${pointer}: value ${JSON.stringify(value)} does not match pattern ${schema.pattern}`);
    }
  }

  if ((schemaAllowsType(schema, 'number') || schemaAllowsType(schema, 'integer')) && typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${pointer}: expected number >= ${schema.minimum}, received ${value}`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${pointer}: expected number <= ${schema.maximum}, received ${value}`);
    }
    if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
      errors.push(`${pointer}: expected number > ${schema.exclusiveMinimum}, received ${value}`);
    }
    if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) {
      errors.push(`${pointer}: expected number < ${schema.exclusiveMaximum}, received ${value}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function resolveLocalRef(rootSchema, ref) {
  if (!ref.startsWith('#/')) {
    return { ok: false };
  }
  const segments = ref
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current = rootSchema;
  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return { ok: false };
    }
    current = current[segment];
  }
  return current && typeof current === 'object' ? { ok: true, schema: current } : { ok: false };
}

module.exports = {
  SUPPORTED_SCHEMA_KEYWORDS,
  validateAgainstSchema,
};
