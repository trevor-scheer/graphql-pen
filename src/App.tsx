import React, {Component} from 'react';
import {
  graphql,
  parse,
  buildSchema,
  isExecutableDefinitionNode,
  Source,
  isTypeSystemDefinitionNode,
  validate,
  GraphQLSchema,
  DocumentNode,
  GraphQLError,
  GraphQLObjectType,
  GraphQLNamedType,
} from 'graphql';
import {addMockFunctionsToSchema} from 'graphql-tools';

import {mockSchema, mockOperations} from './mocks';
import {CodeEditor} from './components/CodeEditor';
import {buildFakerResolvers} from './utils/buildFakerResolvers';
import {prettify} from './utils/prettify';

import './App.scss';

function getValidOperationsDocument(operationsCode: string) {
  const source = new Source(operationsCode);
  const document = parse(source);
  const areAllNodesExecutable = document.definitions.every(
    isExecutableDefinitionNode
  );
  return areAllNodesExecutable ? document : null;
}

function getValidatedSchema(schemaCode: string) {
  const source = new Source(schemaCode);
  const document = parse(source);
  const allNodesAreTypeDefs = document.definitions.every(
    isTypeSystemDefinitionNode
  );

  return allNodesAreTypeDefs ? buildSchema(schemaCode) : null;
}

type State = {
  schemaCode: string;
  schema: GraphQLSchema | null;
  schemaErrors: ReadonlyArray<GraphQLError> | null;
  operationsCode: string;
  operationsDocument: DocumentNode | null;
  operationsErrors: ReadonlyArray<GraphQLError> | null;
  validationErrors: ReadonlyArray<GraphQLError> | null;
  queryResult: string;
};

class App extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      schemaCode: mockSchema,
      schema: null,
      schemaErrors: null,
      operationsCode: mockOperations,
      operationsDocument: null,
      operationsErrors: null,
      validationErrors: null,
      queryResult: '{}',
    };
  }

  componentDidMount() {
    this.handleSchemaChange(this.state.schemaCode);
    this.handleOperationsChange(this.state.operationsCode);
  }

  handleSchemaChange = (schemaCode: string) => {
    let schema = null,
      schemaErrors = null;
    try {
      schema = getValidatedSchema(schemaCode);
    } catch (e) {
      console.log(e);
      schemaErrors = e as ReadonlyArray<GraphQLError>;
    }
    this.setState(
      {schemaCode, schema, schemaErrors},
      this.validateOperationsAgainstSchema
    );
  };

  handleOperationsChange = (operationsCode: string) => {
    let operationsDocument = null,
      operationsErrors = null;
    try {
      operationsDocument = getValidOperationsDocument(operationsCode);
    } catch (e) {
      console.log('oErrors');
      operationsErrors = e as ReadonlyArray<GraphQLError>;
    }
    this.setState(
      {operationsCode, operationsDocument, operationsErrors},
      this.validateOperationsAgainstSchema
    );
  };

  validateOperationsAgainstSchema = () => {
    let validationErrors = null;
    const {operationsDocument, schema} = this.state;
    if (schema && operationsDocument) {
      try {
        validationErrors = validate(schema, operationsDocument);
      } catch (e) {
        console.log('vErrors');
        validationErrors = [e.message];
      }
    }
    this.setState({validationErrors});
  };

  handlePrettify = () => {
    try {
      this.handleOperationsChange(prettify(this.state.operationsCode));
      this.handleSchemaChange(prettify(this.state.schemaCode));
    } catch {}
  };

  handleExecuteQuery = () => {
    const {schema} = this.state;
    if (schema) {
      addMockFunctionsToSchema({
        schema,
        mocks: buildFakerResolvers(schema.getTypeMap()),
      });
      graphql(schema, this.state.operationsCode).then(result => {
        console.log(result);
        this.setState({queryResult: JSON.stringify(result, null, 2)});
      });
    }
  };

  render() {
    const {
      schemaCode,
      schema,
      operationsCode,
      schemaErrors,
      operationsErrors,
      validationErrors,
      queryResult,
    } = this.state;

    return (
      <div className="App">
        <div className="App-editors">
          <CodeEditor
            value={schemaCode}
            handleChange={this.handleSchemaChange}
          />
          <CodeEditor
            value={operationsCode}
            handleChange={this.handleOperationsChange}
            schema={schema}
          />
        </div>
        <CodeEditor
          value={queryResult}
          codeMirrorOpts={{
            mode: {name: 'javascript', json: true},
            readOnly: true,
          }}
        />
        <button onClick={this.handlePrettify}>Prettify</button>
        <p>
          {schemaErrors && JSON.stringify(schemaErrors)}
          {operationsErrors && JSON.stringify(operationsErrors)}
          {Array.isArray(validationErrors) &&
            validationErrors.length > 0 &&
            JSON.stringify(validationErrors)}
        </p>
        <button onClick={this.handleExecuteQuery}>Execute</button>
      </div>
    );
  }
}

export default App;
