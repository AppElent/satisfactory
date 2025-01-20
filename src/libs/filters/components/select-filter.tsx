import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useMemo } from 'react';
import { Filter, SelectFilter as SelectFilterType } from '..';

interface SelectFilterProps {
  id: string;
  filterOptions: {
    filters: Filter[];
    setFilter: (id: string, filter: Filter) => void;
  };
}

const SelectFilter = ({ id, filterOptions }: SelectFilterProps) => {
  const { filters, setFilter } = filterOptions;
  const filter = useMemo(
    () =>
      filters.find(
        (filter): filter is SelectFilterType => filter.id === id && filter.type === 'select'
      ) || null,
    [filters, id]
  );

  if (!filter) {
    throw new Error(`Filter with id ${id} not found`);
  }

  const handleChange = (e: any) => {
    const value = e.target.value;
    const text = filter.options.find((option) => option.value === value)?.label;
    setFilter(id, { ...filter, value, text });
  };

  return (
    <FormControl fullWidth>
      <InputLabel>{filter.label}</InputLabel>
      <Select
        label={filter.label}
        value={filter.value}
        onChange={handleChange}
      >
        {filter.options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectFilter;
