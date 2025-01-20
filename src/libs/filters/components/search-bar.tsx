import { IconButton, InputAdornment, OutlinedInput, OutlinedInputProps } from '@mui/material';
// import SearchBar from '../../../components/default/ui/search-bar';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchBarProps {
  filter: {
    inputQuery: string;
    setSearchQuery: (query: string) => void;
  };
  muiOutlinedInputProps?: OutlinedInputProps;
}

const SearchBar = ({ filter, muiOutlinedInputProps }: SearchBarProps) => {
  return (
    <>
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
              onClick={() => filter.setSearchQuery('')}
              onMouseDown={(e) => e.preventDefault()}
              edge="end"
            >
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        }
        autoFocus
        value={filter.inputQuery || ''}
        sx={{ flexGrow: 1 }}
        onChange={(e) => filter.setSearchQuery(e.target.value)}
        {...muiOutlinedInputProps}
        placeholder={muiOutlinedInputProps?.placeholder || 'Search'}
      />
    </>
    // <SearchBar
    //   onClear={() => filter.setSearchQuery('')}
    //   value={filter.inputQuery}
    //   onChange={(e) => filter.setSearchQuery(e.target.value)}
    //   muiOutlinedInputProps={muiOutlinedInputProps}
    // />
  );
};

export default SearchBar;
