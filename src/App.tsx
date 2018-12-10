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
} from 'graphql';
import {addMockFunctionsToSchema} from 'graphql-tools';

import {mockSchema, mockOperations} from './mocks';
import {CodeEditor} from './components/CodeEditor';
import {buildFakerResolvers} from './utils/buildFakerResolvers';
import {prettify} from './utils/prettify';

import './App.scss';

function getValidOperationsDocument(operationsCode: string) {
  const document = parse(new Source(operationsCode));
  const areAllNodesExecutable = document.definitions.every(
    isExecutableDefinitionNode
  );
  return areAllNodesExecutable ? document : null;
}

function getValidatedSchema(schemaCode: string) {
  const document = parse(new Source(schemaCode));
  const allNodesAreTypeDefs = document.definitions.every(
    isTypeSystemDefinitionNode
  );

  return allNodesAreTypeDefs ? buildSchema(schemaCode) : null;
}

type Props = {};

type State = {
  schemaCode: string;
  schema: GraphQLSchema | null;
  schemaErrors: ReadonlyArray<GraphQLError>;
  operationsCode: string;
  operationsDocument: DocumentNode | null;
  operationsErrors: ReadonlyArray<GraphQLError>;
  validationErrors: ReadonlyArray<GraphQLError>;
  queryResult: string;
};

class App extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      schemaCode: mockSchema,
      schema: null,
      schemaErrors: [],
      operationsCode: mockOperations,
      operationsDocument: null,
      operationsErrors: [],
      validationErrors: [],
      queryResult: '',
    };
  }

  componentDidMount() {
    this.handleSchemaChange(this.state.schemaCode);
    this.handleOperationsChange(this.state.operationsCode);
  }

  handleSchemaChange = (schemaCode: string) => {
    let schema = null,
      schemaErrors: ReadonlyArray<GraphQLError> = [];
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
      operationsErrors: ReadonlyArray<GraphQLError> = [];
    try {
      operationsDocument = getValidOperationsDocument(operationsCode);
    } catch (e) {
      operationsErrors = e as ReadonlyArray<GraphQLError>;
    }
    this.setState(
      {operationsCode, operationsDocument, operationsErrors},
      this.validateOperationsAgainstSchema
    );
  };

  validateOperationsAgainstSchema = () => {
    const {operationsDocument, schema} = this.state;
    if (schema && operationsDocument) {
      this.setState({validationErrors: validate(schema, operationsDocument)});
    }
  };

  handlePrettify = () => {
    try {
      this.handleOperationsChange(prettify(this.state.operationsCode));
      this.handleSchemaChange(prettify(this.state.schemaCode));
    } catch {}
  };

  handleExecuteQuery = () => {
    const {schema, operationsCode} = this.state;
    if (schema) {
      addMockFunctionsToSchema({
        schema,
        mocks: buildFakerResolvers(schema.getTypeMap()),
      });

      graphql(schema, operationsCode).then(result => {
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
        <pre>
          {schemaErrors.length > 0 && JSON.stringify(schemaErrors, null, 2)}
          {operationsErrors.length > 0 &&
            JSON.stringify(operationsErrors, null, 2)}
          {validationErrors.length > 0 &&
            JSON.stringify(validationErrors, null, 2)}
        </pre>
        <button onClick={this.handleExecuteQuery}>Execute</button>
      </div>
    );
  }
}

export default App;
