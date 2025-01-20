import { FormControl, FormControlProps, MenuItem, TextField, TextFieldProps } from '@mui/material';

interface SortOptionsProps {
  value: string;
  options: { value: string; label: string }[];
  handleSortChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  muiFormControlProps?: FormControlProps;
  muiTextFieldProps?: TextFieldProps;
}

const SortOptions = ({ value, options, handleSortChange, ...rest }: SortOptionsProps) => {
  const { muiFormControlProps, muiTextFieldProps } = rest;

  return (
    <FormControl
      className="sort-options"
      {...muiFormControlProps}
    >
      <TextField
        id="sort-label"
        label="Sort By"
        select
        value={value}
        onChange={handleSortChange}
        margin="dense"
        size="small"
        {...muiTextFieldProps}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </FormControl>
  );
};

export default SortOptions;
