import { IconButton, InputAdornment, OutlinedInput, OutlinedInputProps } from '@mui/material';

import ClearIcon from '@mui/icons-material/Clear';

interface SearchBarProps {
  onClear: () => void;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  muiOutlinedInputProps?: OutlinedInputProps;
}

const SearchBar = ({
  onClear,
  value,
  onChange,
  placeholder,
  muiOutlinedInputProps,
}: SearchBarProps) => {
  return (
    <OutlinedInput
      // startAdornment={
      //   <InputAdornment position="start">
      //     <SvgIcon>{/* <SearchMdIcon /> */}</SvgIcon>
      //   </InputAdornment>
      // }
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            aria-label="clear"
            onClick={onClear}
            onMouseDown={(e) => e.preventDefault()}
            edge="end"
          >
            <ClearIcon />
          </IconButton>
        </InputAdornment>
      }
      autoFocus
      value={value || ''}
      sx={{ flexGrow: 1 }}
      onChange={onChange}
      {...muiOutlinedInputProps}
      placeholder={placeholder || 'Search'}
    />
  );
};

export default SearchBar;
