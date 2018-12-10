import {TypeMap} from 'graphql/type/schema';
import {GraphQLNamedType, GraphQLObjectType} from 'graphql';
import faker from 'faker';
import {IMocks} from 'graphql-tools';

export function isObjectType(
  type: GraphQLNamedType
): type is GraphQLObjectType {
  return type instanceof GraphQLObjectType;
}

function getFakerCall(fieldDescription: string): () => any {
  const [category, fn] = fieldDescription.split('.');
  if ((<any>faker)[category] && (<any>faker)[category][fn]) {
    return (<any>faker)[category][fn];
  }
  throw Error('Invalid Faker API provided in field description');
}

export function buildFakerResolvers(typeMap: TypeMap) {
  const userTypes = Object.values(typeMap)
    .filter(isObjectType)
    .filter(type => type.name !== 'Query' && !type.name.includes('__'))
    .reduce((types: IMocks, userType) => {
      types[userType.name] = () =>
        Object.entries(userType.getFields()).reduce(
          (fields: {[key: string]: any}, [fieldName, field]) => {
            if (Boolean(field.description)) {
              try {
                fields[fieldName] = getFakerCall(field.description!);
              } catch {
                throw new Error(
                  `Invalid Faker call at ${userType}:${fieldName}`
                );
              }
            }
            return fields;
          },
          {}
        );
      return types;
    }, {});

  return userTypes;
}
