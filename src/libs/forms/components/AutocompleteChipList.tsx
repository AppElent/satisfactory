import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import {
  Autocomplete,
  AutocompleteProps,
  Chip,
  ChipProps,
  TextField,
  TextFieldProps,
} from '@mui/material';
import _ from 'lodash';
import { useMemo } from 'react';

interface AutocompleteChipListProps {
  name?: string;
  field?: FieldConfig;
  suggestions?: string[];
  muiAutocompleteProps?: Partial<AutocompleteProps<any, any, any, any>>;
  muiChipProps?: ChipProps;
  muiTextFieldProps?: TextFieldProps;
}

const AutocompleteChipList = ({
  name,
  field: fieldConfig,
  suggestions,
  ...props
}: AutocompleteChipListProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string);
  const { options, field, helpers, meta } = data;

  // Merge custom props with default props
  const newProps = _.merge({}, options, props);
  // Merge suggestions with default suggestions and remove the current values
  const mergedSuggestions = useMemo(
    () =>
      Array.from(new Set([...(fieldConfig?.custom?.suggestions || []), ...(suggestions || [])]))
        .filter((suggestion) => !field.value.includes(suggestion))
        .sort(Intl.Collator().compare),
    [field.value, fieldConfig?.custom?.suggestions, suggestions]
  );

  return (
    <Autocomplete
      multiple
      freeSolo
      {...(newProps?.muiAutoCompleteProps || {})}
      options={mergedSuggestions || []}
      value={field.value || []}
      onChange={(_event, newValue) => helpers.setValue(newValue)}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option}
            {...getTagProps({ index })}
            key={option}
            onDelete={() => {
              const newKeywords = field.value.filter((keyword: string) => keyword !== option);
              helpers.setValue(newKeywords);
            }}
            {...newProps?.muiChipProps}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={fieldConfig?.label || fieldName}
          placeholder={`Add tag`}
          margin="dense"
          {...newProps?.muiTextFieldProps}
          multiline={false}
          error={meta.touched && Boolean(meta.error)}
          helperText={meta.touched && meta.error}
        />
      )}
    />
  );
};

export default AutocompleteChipList;
