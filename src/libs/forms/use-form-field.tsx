import { debounce } from '@mui/material';
import {
  FieldHelperProps,
  FieldInputProps,
  FieldMetaProps,
  FormikContextType,
  useField,
  useFormikContext,
} from 'formik';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldConfig, FieldOptions } from '.';
import { useFormOptions } from './custom-form';

interface UseFormFieldsReturn {
  formik: FormikContextType<any>;
  options: FieldOptions;
  field: FieldInputProps<any>;
  meta: FieldMetaProps<any>;
  helpers: FieldHelperProps<any>;
  fieldConfig?: FieldConfig;
}

const useFormField = (name: string, fieldConfig?: FieldConfig): UseFormFieldsReturn => {
  const { t } = useTranslation();
  const formik = useFormikContext();
  const options = useFormOptions();
  const [field, meta, helpers] = useField(name);
  const [inputValue, setInputValue] = useState(field.value);

  // Merge fieldConfig with default field options
  const newProps = _.merge({}, options, fieldConfig?.custom || {});

  // Watch for changes in formik state and update the local state
  useEffect(() => {
    if (field.value && field.value !== inputValue) {
      setInputValue(field.value);
    }
  }, [field?.value]);

  // Check for debounce setting. If set, debounce the change handler
  const debounceValue = options?.debounce || 0;
  const debouncedHandleChange = useMemo(
    () =>
      debounce((value) => {
        helpers.setValue(value);
      }, debounceValue), // Adjust delay as needed
    [field.name, helpers]
  );

  // Translate label
  const label = fieldConfig?.translationKey
    ? t(fieldConfig?.translationKey, { defaultValue: fieldConfig?.label || name })
    : fieldConfig?.label || name;
  if (fieldConfig && label !== fieldConfig?.label) {
    fieldConfig.label = label;
  }

  // If meta.error is a string, return, otherwise translate the error
  let newError: any = meta.error;
  if (newError && !(typeof newError === 'string')) {
    console.log(newError);
    newError = t(newError?.key, { ...newError?.values, field: label });
  }
  const newMeta = {
    ...meta,
    error: newError,
  };

  // If debounce is set, return the debounced handler
  if (debounceValue > 0) {
    return {
      formik,
      options: newProps,
      field: {
        ...field,
        value: inputValue,
        onChange: (e: any) => {
          setInputValue(e.target.value);
          debouncedHandleChange(e.target.value);
        },
      },
      meta: newMeta,
      helpers,
    };
  }

  return { formik, options, field, meta: newMeta, helpers, fieldConfig };
};

export default useFormField;
