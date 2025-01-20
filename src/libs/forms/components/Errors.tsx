import { FieldConfig } from '@/libs/forms';
import { Alert, AlertTitle, Box } from '@mui/material';
import { useFormikContext } from 'formik';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

interface FormValues {
  [key: string]: string;
}

const Errors = ({ fields }: { fields: { [key: string]: FieldConfig } }) => {
  const { t } = useTranslation();
  const formik = useFormikContext<FormValues>();

  const getError = (key: string) => {
    const fieldConfig = fields[key];
    // Translate label
    const label = fieldConfig?.translationKey
      ? t(fieldConfig?.translationKey, { defaultValue: fieldConfig?.label || name })
      : fieldConfig?.label || name;
    // If meta.error is a string, return, otherwise translate the error
    console.log('label', label, fieldConfig, key, fields.fields);
    let newError: any = formik.errors[key];
    if (newError && !(typeof newError === 'string')) {
      console.log(newError);
      newError = t(newError?.key, { ...newError?.values, field: label });
    }
    return newError;
  };

  const title = t('common:errors.title', { count: Object.keys(formik.errors).length });

  return (
    <>
      {!_.isEmpty(formik.errors) && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Alert severity="error">
            <AlertTitle>{title}</AlertTitle>
            {Object.keys(formik.errors).length === 1 ? (
              getError(Object.keys(formik.errors)[0])
            ) : (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {Object.keys(formik.errors).map((key, index) => {
                  const error = getError(key);
                  return <li key={index}>{error}</li>;
                })}
              </ul>
            )}
          </Alert>
        </Box>
      )}

      {/* {Object.keys(formik.errors).map((key) => {
        const error = getError(key);
        return (
          <Typography
            key={key}
            color="error"
          >
            {error}
          </Typography>
        );
      })} */}
    </>
  );
};

export default Errors;
