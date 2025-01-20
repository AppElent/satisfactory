import ReactJson, { InteractionProps, ReactJsonViewProps } from '@microlink/react-json-view';

interface JsonEditorProps extends ReactJsonViewProps {
  validationSchema?: any;
}

/**
 * @typedef {Object} JsonEditorProps
 * @property {boolean} check
 * @property {any} data
 * @property {ReactJsonViewProps} options
 */

/**
 * Default properties for JsonEditor
 */
const defaultProps: Partial<JsonEditorProps> = {
  theme: 'rjv-default',
  collapsed: true,
  collapseStringsAfterLength: 15,
  displayObjectSize: true,
  enableClipboard: true,
  indentWidth: 4,
  displayDataTypes: true,
  iconStyle: 'triangle',
};

/**
 * JsonEditor component
 * @param {JsonEditorProps} props
 */
const JsonEditor = (props: { data: any; options?: Partial<JsonEditorProps> }) => {
  const { data, options } = props;
  const { validationSchema, ...jsonEditorOptions } = { ...defaultProps, ...options };

  const handleAdd = (data: InteractionProps) => {
    //validationSchema.validate(data)
    console.log('handleAdd', data);
  };

  return (
    <div>
      {/* <JsonEditorExternal
        data={data}
        setData={(alldata: any) => console.log(alldata)} // optional
        theme={['githubLight']}
        restrictDrag={false}
        restrictDelete={false}
        collapse={true}
      /> */}
      <ReactJson
        src={data}
        {...jsonEditorOptions}
        onAdd={handleAdd}
        onDelete={handleAdd}
        onEdit={handleAdd}
      />
    </div>
  );
};

export default JsonEditor;
