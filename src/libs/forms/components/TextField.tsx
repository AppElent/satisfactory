import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import { TextField as DTextField, TextFieldProps } from '@mui/material';
import _ from 'lodash';

interface CustomTextFieldProps {
  name?: string;
  field?: FieldConfig;
  muiTextFieldProps?: TextFieldProps;
}

const TextField = ({ name, field: fieldConfig, ...props }: CustomTextFieldProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string, fieldConfig);
  const { options, field, meta } = data;

  const newProps = _.merge({}, options, props);

  // const label = fieldConfig?.translationKey
  //   ? t(fieldConfig?.translationKey, { defaultValue: fieldConfig?.label || fieldName })
  //   : fieldConfig?.label || name;)

  return (
    <DTextField
      key={fieldName}
      margin="dense"
      name={fieldName}
      label={fieldConfig?.label || fieldName}
      value={field.value !== undefined ? field.value : ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
      //type={fieldConfig?.type || 'text'}
      {...newProps?.muiTextFieldProps}
    />
  );
};

export default TextField;
