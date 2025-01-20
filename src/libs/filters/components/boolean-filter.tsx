import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  RadioGroupProps,
} from '@mui/material';
import { useMemo } from 'react';
import { BooleanFilter as BooleanFilterType, Filter } from '..';

interface BooleanFilterProps {
  id: string;
  filterOptions: {
    filters: Filter[];
    setFilter: (id: string, filter: Filter) => void;
  };
  muiRadioGroupProps?: RadioGroupProps;
}

const BooleanFilter = ({ id, filterOptions, muiRadioGroupProps }: BooleanFilterProps) => {
  const { filters, setFilter } = filterOptions;
  const filter = useMemo(
    () =>
      filters.find(
        (filter): filter is BooleanFilterType => filter.id === id && filter.type === 'boolean'
      ) || null,
    [filters, id]
  );

  if (!filter) {
    throw new Error(`Filter with id ${id} not found`);
  }

  //const [filter, setFilter] = useState<BooleanFilter | null>(initialFilter);
  const handleChange = (e: any) => {
    const value = e.target.value === 'unset' ? null : e.target.value === 'true';
    const text = value === null ? undefined : value ? 'Alternate: Yes' : 'Alternate: No';
    setFilter(id, { ...filter, value, text });
  };

  return (
    <FormControl>
      <FormLabel>{filter.label}</FormLabel>
      <RadioGroup
        row
        value={filter.value === null ? 'unset' : filter.value.toString()}
        onChange={handleChange}
        sx={{ flexDirection: 'row' }}
        {...muiRadioGroupProps}
      >
        <FormControlLabel
          value="unset"
          control={<Radio />}
          label="All"
        />
        <FormControlLabel
          value="true"
          control={<Radio />}
          label="Yes"
        />
        <FormControlLabel
          value="false"
          control={<Radio />}
          label="No"
        />
      </RadioGroup>
    </FormControl>
  );
};

export default BooleanFilter;
