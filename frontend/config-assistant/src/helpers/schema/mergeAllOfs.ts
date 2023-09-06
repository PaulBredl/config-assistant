import type {JsonSchemaObjectType} from '@/model/JsonSchemaType';
// @ts-ignore
import mergeAllOf from 'json-schema-merge-allof';

export function mergeAllOfs(schema: JsonSchemaObjectType): JsonSchemaObjectType {
  console.log('merge allOfs for ', schema);
  return mergeAllOf(schema, {
    deep: false,
    resolvers: {
      defaultResolver: mergeAllOf.options.resolvers.title,
      // add additional resolvers here, most of the keywords are NOT supported by default
    },
  });
}

export function safeMergeAllOfs(schema: JsonSchemaObjectType): JsonSchemaObjectType | false {
  console.log('merge allOfs for ', schema);
  try {
    return mergeAllOf(schema, {
      deep: false,
      resolvers: {
        defaultResolver: mergeAllOf.options.resolvers.title,
        // add additional resolvers here, most of the keywords are NOT supported by default
      },
    });
  } catch (e) {
    console.log('Cannot merge allOfs for ', schema);
    return false;
  }
}