import { useFormik } from 'formik';
import _ from 'lodash';
import { useMemo } from 'react';
import { FieldConfig } from '.';

interface UseCustomFormikProps
  extends Omit<Parameters<typeof useFormik>[0], 'onSubmit' | 'initialValues'> {
  preSave?: (values: any, formik: any) => any;
  onSubmit: (values: any, formikHelpers: any) => Promise<any>;
  validationSchema?: any;
  fields?: {
    [key: string]: FieldConfig;
  };
  initialValues?: any;
  // [key: string]: any;
}

const useCustomFormik = (props: UseCustomFormikProps) => {
  const { preSave, fields, onSubmit, validationSchema, ...formikProps } = props;
  // TODO: initial values
  // TODO: submit logic

  // Generate initial values based on fields
  const initialValues = useMemo(() => {
    let values = fields
      ? Object.keys(fields).reduce((acc: any, key: string) => {
          const field = fields[key];
          if (field.initialValue) {
            _.set(acc, field.name, field.initialValue);
          }
          return acc;
        }, {})
      : {};

    if (formikProps && formikProps.initialValues) {
      values = {
        ...formikProps.initialValues,
        ...values,
      };
    }

    values = {
      ...(formikProps && formikProps.initialValues && formikProps.initialValues),
      ...(validationSchema && validationSchema.getDefault()),
      ...values,
    };

    return values;
  }, [fields, formikProps.initialValues, validationSchema]);

  const formik = useFormik({
    ...formikProps,
    initialValues,
    validationSchema,
    onSubmit: async (values, formikHelpers) => {
      try {
        console.log('Form Submitted:', values);
        // Submit
        await onSubmit(values, formikHelpers);
      } catch (e) {
        console.error(e);
        await formik.resetForm();
        return e;
      } finally {
        formik.setSubmitting(false);
      }
    },
  });

  // Overwrite handleSubmit with custom logic
  const customHandleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    const values = formik.values;

    // Run presave function
    if (preSave) {
      preSave(values, formik);
    }

    // Submit
    await formik.handleSubmit(e);
  };

  // Overwrite default formik handleChange with a debounced version
  // const debouncedHandleChange = useMemo(
  //   () =>
  //     _.debounce((value) => {
  //       console.log('test');
  //       formik.handleChange(value);
  //     }, 500),
  //   [formik.handleChange]
  // );

  return { ...formik, handleSubmit: customHandleSubmit };
};

export default useCustomFormik;
