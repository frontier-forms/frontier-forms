import { FrontierDataGraphQLProps, schemaFromGraphQLProps } from './graphql';

export type FrontierDataProps = FrontierDataGraphQLProps;

export function schemaFromDataProps (props: FrontierDataProps) {
  return schemaFromGraphQLProps(props);
}
