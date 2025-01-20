import { useFormButton } from '@/libs/forms';
import { ButtonProps, Button as DefaultButton } from '@mui/material';
import _ from 'lodash';

const CancelButton = (props: ButtonProps) => {
  const { formik, options } = useFormButton();
  const { onClick } = props;

  const newProps = _.merge({}, options, props);

  const disabled = formik.isSubmitting;

  return (
    <DefaultButton
      color="secondary"
      variant="outlined"
      disabled={disabled}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        formik.resetForm();
        if (onClick) onClick(e);
      }}
      {...newProps.muiButtonProps}
    >
      Cancel
    </DefaultButton>
  );
};

export default CancelButton;
