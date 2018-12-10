export const mockSchema = `type Query {
  """random.uuid"""
  id: ID!
  student: Student!
}

type Student {
  id: ID!
  """name.firstName"""
  name: String!
}
`;

export const mockOperations = `query test {
  id
  student {
    id
    name
  }
}
`;
