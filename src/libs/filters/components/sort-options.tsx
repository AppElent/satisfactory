import { FormControl, FormControlProps, MenuItem, TextField, TextFieldProps } from '@mui/material';

interface SortOptionsProps {
  filter: {
    sortField: string | null;
    sortDirection: 'asc' | 'desc';
    setSortField: (sortField: string | null) => void;
    setSortDirection: (sortDirection: 'asc' | 'desc') => void;
  };
  options: { value: string; label: string }[];
  muiFormControlProps?: FormControlProps;
  muiTextFieldProps?: TextFieldProps;
}

const SortOptions = ({ filter, ...rest }: SortOptionsProps) => {
  const { options, muiFormControlProps, muiTextFieldProps } = rest;
  const value = `${filter.sortField}-${filter.sortDirection}`;

  const handleSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [sortField, sortDirection] = e.target.value.split('-');
    filter.setSortField(sortField);
    filter.setSortDirection(sortDirection as 'asc' | 'desc');
  };

  return (
    // <SortOptions
    //   value={value}
    //   handleSortChange={handleSortChange}
    //   {...rest}
    // />
    <FormControl
      className="sort-options"
      fullWidth
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
