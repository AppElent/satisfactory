import {
  Box,
  BoxProps,
  Slider,
  SliderProps,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { Filter, RangeFilter as RangeFilterType } from '..';

interface RangeFilterProps {
  id: string;
  filterOptions: {
    filters: Filter[];
    setFilter: (id: string, filter: Filter) => void;
  };
  showTextFields?: boolean;
  muiBoxProps?: BoxProps;
  muiTextFieldProps?: TextFieldProps;
  muiSliderProps?: SliderProps;
}

const RangeFilter = ({
  id,
  filterOptions,
  showTextFields,
  muiTextFieldProps,
  muiSliderProps,
  muiBoxProps,
}: RangeFilterProps) => {
  const { filters, setFilter } = filterOptions;
  const filter = useMemo(
    () =>
      filters.find(
        (filter): filter is RangeFilterType => filter.id === id && filter.type === 'range'
      ) || null,
    [filters, id]
  );

  if (!filter) {
    throw new Error(`Filter with id ${id} not found`);
  }

  const setMinMax = (value: number[]) => {
    setFilter(id, { ...filter, value });
  };

  //   const setMinMax = useMemo(
  //     () =>
  //       debounce((value: number[]) => {
  //         setFilter(id, { ...filter, value });
  //       }, 100),
  //     [id, filter, setFilter]
  //   );

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      {...muiBoxProps}
    >
      {showTextFields && (
        <>
          <TextField
            label={`${filter.label} Min`}
            type="number"
            value={filter.value[0] ?? ''}
            onChange={(e) => {
              const value = isNaN(Number(e.target.value)) ? undefined : Number(e.target.value);
              setMinMax([Number(value || filter.value[0]), filter.value[1]]);
            }}
            {...muiTextFieldProps}
          />
          <TextField
            label={`${filter.label} Max`}
            type="number"
            value={filter.value[1] ?? ''}
            onChange={(e) => {
              const value = isNaN(Number(e.target.value)) ? undefined : Number(e.target.value);
              setMinMax([filter.value[0], Number(value || filter.value[1])]);
            }}
            {...muiTextFieldProps}
          />
        </>
      )}
      <Typography
        id="input-slider"
        gutterBottom
      >
        {filter.label}
      </Typography>
      <Slider
        value={filter.value}
        onChange={(_event: Event, newValue: number | number[]) => {
          //   setFilter(id, { ...filter, value: newValue as number[] });
          setMinMax(newValue as number[]);
        }}
        // valueLabelDisplay="auto"
        valueLabelDisplay={showTextFields ? 'auto' : 'on'}
        min={0}
        max={100}
        {...muiSliderProps}
      />
    </Box>
  );
};

export default RangeFilter;
