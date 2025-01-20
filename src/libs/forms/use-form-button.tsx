import { useFormikContext } from 'formik';
import { useFormOptions } from './custom-form';

const useFormButton = () => {
  const formik = useFormikContext();
  const options = useFormOptions();

  return { formik, options };
};

export default useFormButton;
