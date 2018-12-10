import React, {Component, createRef, RefObject} from 'react';
import CodeMirror, {Editor, EditorConfiguration} from 'codemirror';
import {GraphQLSchema, assertValidSchema} from 'graphql';

declare module 'codemirror' {
  function CodeMirror(
    host: HTMLElement,
    options?: CodeMirror.EditorConfiguration
  ): CodeMirror.Editor;

  interface EditorConfiguration {
    autoCloseBrackets?: boolean;
    matchBrackets?: boolean;
    hintOptions?: {schema?: GraphQLSchema | null};
  }

  interface LintOptions {
    schema?: GraphQLSchema | null;
  }
}

type Props = {
  options?: EditorConfiguration;
  value: string;
  handleChange?: (value: string) => void;
  schema?: GraphQLSchema | null;
  codeMirrorOpts?: EditorConfiguration;
};

export class CodeEditor extends Component<Props, {}> {
  private node: RefObject<HTMLTextAreaElement> | null = null;
  private _editor: Editor | null = null;
  private cachedValue: string = '';

  constructor(props: Props) {
    super(props);
    this.node = createRef<HTMLTextAreaElement>();
  }

  componentDidMount() {
    this._editor = CodeMirror.fromTextArea(this.node!.current!, {
      mode: 'graphql',
      theme: 'material',
      lineNumbers: true,
      tabSize: 2,
      autoCloseBrackets: true,
      matchBrackets: true,
      indentWithTabs: false,
      indentUnit: 2,
      showCursorWhenSelecting: true,
      extraKeys: {'Ctrl-Space': 'autocomplete'},
      ...this.props.codeMirrorOpts,
    });

    if (this.props.schema) {
      this.editor.setOption('lint', {schema: this.props.schema});
      this.editor.setOption('hintOptions', {schema: this.props.schema});
    }
    this.editor.setValue(this.props.value);
    this.editor.on('change', this.handleChange);
  }

  get editor(): Editor {
    return this._editor!;
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.value !== prevProps.value &&
      this.props.value !== this.cachedValue
    ) {
      this.cachedValue = this.props.value;
      this.editor.setValue(this.props.value);
    }

    // Only update the internal schema for lint/hint if it's valid
    if (this.props.schema && this.props.schema !== prevProps.schema) {
      try {
        assertValidSchema(this.props.schema);
        this.editor.setOption('lint', {schema: this.props.schema});
        this.editor.setOption('hintOptions', {schema: this.props.schema});
      } catch {}
    }
  }

  handleChange = () => {
    this.cachedValue = this.editor.getValue();

    if (this.props.handleChange) {
      this.props.handleChange(this.cachedValue);
    }
  };

  render() {
    return <textarea ref={this.node} />;
  }
}
