type FilterType = 'range' | 'select' | 'boolean' | 'multi-select';

interface BaseFilter {
  id: string; // ID or Field name
  label: string; // Display label
  type: FilterType;
  value: any;
  //   onChange: (value: any) => void;
  filterFunction?: (item: any) => boolean; // Custom filter logic
  text?: string;
}

export interface RangeFilter extends BaseFilter {
  type: 'range';
  value: number[]; // [min, max]
}

export interface SelectFilter extends BaseFilter {
  type: 'select';
  value: string;
  options: { label: string; value: string }[];
}

export interface BooleanFilter extends BaseFilter {
  type: 'boolean';
  value: boolean | null;
}

export interface MultiSelectFilter extends BaseFilter {
  type: 'multi-select';
  value: string[]; // Array of selected values
  options: { label: string; value: string }[]; // List of selectable options
}

export type Filter = RangeFilter | SelectFilter | BooleanFilter | MultiSelectFilter;
