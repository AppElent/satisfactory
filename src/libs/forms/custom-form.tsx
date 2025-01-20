import { Form, FormikContextType, FormikProvider } from 'formik';
import { createContext, useContext, useMemo } from 'react';

// Create a context for Formik and global options

import { FieldOptions } from '.';

// Create a context for global options
const FormOptionsContext = createContext({});

export const useFormOptions = (): FieldOptions => useContext(FormOptionsContext);

interface CustomFormProps {
  formik: FormikContextType<any>;
  options?: FieldOptions;
  children: any;
}

const defaultOptions = {
  editMode: false,
};

const CustomForm = ({ formik, children, options }: CustomFormProps) => {
  const newOptions = useMemo(() => ({ ...defaultOptions, ...(options || {}) }), [options]);
  return (
    <FormikProvider value={formik}>
      <FormOptionsContext.Provider value={newOptions}>
        <Form>{children}</Form>
      </FormOptionsContext.Provider>
    </FormikProvider>
  );
};

export default CustomForm;
