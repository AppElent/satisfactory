import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import { FormControl, InputLabel, MenuItem, Select as MUISelect, SelectProps } from '@mui/material';

interface CustomSelectProps {
  name?: string;
  field?: FieldConfig;
  options?: { key: string; value: string }[];
  muiSelectProps?: SelectProps;
}

const Select = ({ name, field: fieldConfig, options: menuOptions }: CustomSelectProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string, fieldConfig);
  const { options, field, meta } = data;

  const selectOptions = menuOptions || fieldConfig?.options || [];

  return (
    <>
      <FormControl>
        <InputLabel id="myLabel">{fieldConfig?.label || fieldName}</InputLabel>
        <MUISelect
          name={`${fieldName}`}
          value={field.value || fieldConfig?.default || ''}
          onChange={field.onChange}
          error={meta.touched && Boolean(meta.error)}
          label={fieldConfig?.label || fieldName}
          onClick={(e) => e.stopPropagation()}
          sx={{ width: '100%' }}
          size={'small'}
        >
          {selectOptions.map((option: any) => (
            <MenuItem
              key={options.key || option.value}
              value={option.key || option.value}
            >
              {option.value}
            </MenuItem>
          ))}
        </MUISelect>
      </FormControl>
      {/* <DTextField
        key={fieldName}
        margin="dense"
        name={fieldName}
        label={fieldConfig?.label || fieldName}
        value={field.value || ''}
        onChange={field.onChange}
        onBlur={field.onBlur}
        error={meta.touched && Boolean(meta.error)}
        helperText={meta.touched && meta.error}
        {...newProps?.muiTextFieldProps}
      /> */}
    </>
  );
};

export default Select;
