import { useFormButton } from '@/libs/forms';
import { ButtonProps, CircularProgress, Button as DefaultButton, Tooltip } from '@mui/material';
import _ from 'lodash';

const SubmitButton = (props: ButtonProps) => {
  const { formik, options } = useFormButton();
  const { onClick } = props;

  const newProps = _.merge({}, options, props);

  const disabled = formik.isSubmitting || !formik.isValid || !formik.dirty;

  let disabledText: string = `Values are good to save`;

  if (disabled) {
    if (!formik.dirty) {
      disabledText = 'No changes to save';
    } else if (!formik.isValid) {
      disabledText = 'Form is invalid.\n\n';
      console.log(formik.errors);
      Object.keys(formik.errors).forEach((key) => {
        disabledText += `${(formik.errors as Record<string, any>)[key]}\n`;
      });
      //disabledText += formik.errors ? JSON.stringify(formik.errors, null, 2) : '';
    } else if (formik.isSubmitting) {
      disabledText = 'Submitting...';
    }
  }

  const isLoading = formik.isSubmitting;

  return (
    <>
      <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{disabledText}</span>}>
        <span>
          <DefaultButton
            //type="submit"
            color="primary"
            variant="contained"
            disabled={disabled}
            onClick={async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
              await formik.handleSubmit();
              if (onClick) await onClick(e);
            }}
            // onSubmit={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            //   formik.handleSubmit();
            //   if (onClick) onClick(e);
            // }}
            {...newProps.muiButtonProps}
            {...props}
            startIcon={
              isLoading ? (
                <CircularProgress
                  size={20}
                  color="inherit"
                />
              ) : null
            }
          >
            {isLoading ? 'Submitting...' : props.children || 'Submit'}
          </DefaultButton>
        </span>
      </Tooltip>
    </>
  );
};

export default SubmitButton;
