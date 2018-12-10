import prettier from 'prettier/standalone';
import graphQLPlugin from 'prettier/parser-graphql';

export function prettify(source: string) {
  return prettier.format(source, {
    parser: 'graphql',
    plugins: [graphQLPlugin],
  });
}
