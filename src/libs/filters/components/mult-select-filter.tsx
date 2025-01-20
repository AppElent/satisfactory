import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, Select } from '@mui/material';
import { useMemo } from 'react';
import { Filter, MultiSelectFilter as MultiSelectFilterType } from '..';

interface MultiSelectFilterProps {
  id: string;
  filterOptions: {
    filters: Filter[];
    setFilter: (id: string, filter: Filter) => void;
  };
}

const MultiSelectFilter = ({ id, filterOptions }: MultiSelectFilterProps) => {
  const { filters, setFilter } = filterOptions;
  const filter = useMemo(
    () =>
      filters.find(
        (filter): filter is MultiSelectFilterType =>
          filter.id === id && filter.type === 'multi-select'
      ) || null,
    [filters, id]
  );

  if (!filter) {
    throw new Error(`Filter with id ${id} not found`);
  }

  //const [filter, setFilter] = useState<BooleanFilter | null>(initialFilter);
  const handleChange = (e: any) => {
    const value = e.target.value as string[];
    //const value = e.target.value === 'unset' ? null : e.target.value === 'true';
    // If value is not an empty array, set text as value
    const text =
      Array.isArray(value) && value.length > 0
        ? `${filter.label}: ${filter.value.join(', ')}`
        : undefined;
    setFilter(id, { ...filter, value, text });
  };

  return (
    <FormControl
      fullWidth
      size="small"
    >
      <InputLabel>{filter.label}</InputLabel>
      <Select
        multiple
        label={filter.label}
        value={filter.value}
        onChange={handleChange}
        renderValue={(selected) =>
          selected.map((sel) => filter.options.find((o) => o.value === sel)?.label).join(', ')
        } // Show selected values as a comma-separated list
        size="small"
      >
        {filter.options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
          >
            <Checkbox checked={filter.value.includes(option.value)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MultiSelectFilter;
