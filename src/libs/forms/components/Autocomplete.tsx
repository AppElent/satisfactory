import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import {
  AutocompleteProps,
  Box,
  ChipProps,
  Autocomplete as MUIAutocomplete,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material';
import _ from 'lodash';

interface AutocompleteChipListProps {
  name?: string;
  field?: FieldConfig;
  suggestions?: string[];
  muiAutocompleteProps?: Partial<AutocompleteProps<any, any, any, any>>;
  muiChipProps?: ChipProps;
  muiTextFieldProps?: TextFieldProps;
}

const Autocomplete = ({ name, field: fieldConfig, ...props }: AutocompleteChipListProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string);
  const { options, field, helpers, meta } = data;

  // Merge custom props with default props
  const newProps = _.merge({}, options, props);
  // Merge suggestions with default suggestions and remove the current values
  //   const mergedSuggestions = useMemo(
  //     () =>
  //       Array.from(new Set([...(fieldConfig?.custom?.suggestions || []), ...(suggestions || [])]))
  //         .filter((suggestion) => !field.value.includes(suggestion))
  //         .sort(Intl.Collator().compare),
  //     [field.value, fieldConfig?.custom?.suggestions, suggestions]
  //   );

  // TODO: should be unique? getOptionDisabled={(option) => field.value.includes(option)}

  console.log(field.value);
  const selectedOption = fieldConfig?.options?.find((option: any) => option.key === field.value);

  return (
    <MUIAutocomplete
      {...(newProps?.muiAutoCompleteProps || {})}
      options={fieldConfig?.options || []}
      //value={field.value || ''}
      value={selectedOption || null}
      onChange={(_event, newValue) => helpers.setValue(newValue.key)}
      getOptionLabel={(option) => option.label || ''}
      //getOptionDisabled={(option) => field.value.includes(option)}
      //   renderTags={(value, getTagProps) =>
      //     value.map((option, index) => (
      //       <Chip
      //         variant="outlined"
      //         label={option}
      //         {...getTagProps({ index })}
      //         key={option}
      //         onDelete={() => {
      //           const newKeywords = field.value.filter((keyword: string) => keyword !== option);
      //           helpers.setValue(newKeywords);
      //         }}
      //         {...newProps?.muiChipProps}
      //       />
      //     ))
      //   }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={fieldConfig?.label || fieldName}
          //   placeholder={`Add tag`}
          margin="dense"
          {...newProps?.muiTextFieldProps}
          multiline={false}
          error={meta.touched && Boolean(meta.error)}
          helperText={meta.touched && meta.error}
          InputProps={{
            ...params.InputProps,
            startAdornment:
              selectedOption && selectedOption.img ? (
                <Box
                  component="span"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: 1,
                    width: 24,
                    height: 24,
                  }}
                >
                  {typeof selectedOption.img === 'string' ? (
                    <img
                      src={selectedOption.img}
                      alt={selectedOption.label}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        marginRight: 4,
                      }}
                    />
                  ) : (
                    <>{selectedOption.img}</>
                  )}
                </Box>
              ) : null,
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box
          {...props}
          component="li"
          key={option.key}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, padding: '5px' }}
        >
          {option.img && (
            <>
              {typeof option.img === 'string' ? (
                <img
                  src={option.img}
                  alt={option.label}
                  style={{ width: 30, height: 30, borderRadius: '50%' }}
                />
              ) : (
                <>{option.img}</>
              )}
            </>
          )}

          <Typography>{option.label}</Typography>
        </Box>
      )}
    />
  );
};

export default Autocomplete;
