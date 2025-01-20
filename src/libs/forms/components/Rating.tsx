import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import { Box, Rating as DRating, TextFieldProps, Typography } from '@mui/material';
import _ from 'lodash';

interface CustomTextFieldProps {
  name?: string;
  field?: FieldConfig;
  muiTextFieldProps?: TextFieldProps;
}

const Rating = ({ name, field: fieldConfig, ...props }: CustomTextFieldProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string);
  const { options, field, helpers } = data;

  const newProps = _.merge({}, options, props);

  return (
    <Box>
      <Typography component="legend">{fieldConfig?.label || fieldName}</Typography>
      <DRating
        name={field.name}
        value={field.value || 0}
        onChange={(_event, newValue) => {
          helpers.setValue(newValue);
          // if (!options?.editMode) {
          //   formik.handleSubmit();
          // }
        }}
        precision={0.5}
        // icon={<FavoriteIcon fontSize="inherit" />}
        // emptyIcon={<FavoriteBorderIcon fontSize="inherit" />}
        {...(newProps?.muiRatingProps && newProps.muiRatingProps)}
      />
    </Box>
  );
};

export default Rating;
