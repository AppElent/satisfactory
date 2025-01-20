import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  AutocompleteProps,
  ChipProps,
  Table as DTable,
  IconButton,
  TableRow as MUITableRow,
  Stack,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TextFieldProps,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { FieldArray } from 'formik';
import _ from 'lodash';
import React, { useState } from 'react';
import Autocomplete from './Autocomplete';
import Select from './Select';
import TextField from './TextField';

export interface TableProps {
  name?: string;
  field?: FieldConfig;
  tableOptions?: {
    template?: { [key: string]: string | number };
    getTemplate?: () => { [key: string]: string | number };
    editable?: boolean;
    selectable?: boolean;
    columns?: { [key: string]: FieldConfig };
    title?: string;
  };
  muiAutocompleteProps?: Partial<AutocompleteProps<any, any, any, any>>;
  muiChipProps?: ChipProps;
  muiTextFieldProps?: TextFieldProps;
}

const defaultTableOptions = {
  // template: {},
  getTemplate: () => ({}),
  editable: true,
  selectable: false,
  columns: {},
  //title: 'Table title',
};

const Table = ({ name, field: fieldConfig, tableOptions }: TableProps) => {
  const [selected, setSelected] = useState<number[]>([]);
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string);
  const { field, helpers } = data;
  // const mergedTableOptions = _.merge({}, defaultTableOptions, tableOptions);
  // const { template, getTemplate } = mergedTableOptions;
  // console.log(template, getTemplate);

  // const { editable, selectable, columns = {}, title } = fieldConfig?.custom?.table || {};
  // Merge tableOptions with fieldConfig.custom.table
  const mergedTableOptions = _.merge(
    {},
    defaultTableOptions,
    fieldConfig?.custom?.table,
    tableOptions
  );
  const { template, getTemplate, editable, selectable, columns = {}, title } = mergedTableOptions;
  console.log(mergedTableOptions);

  // useEffect(() => {
  //     if (field.value.length === 0) {
  //         helpers.push({});
  //     }
  // }, [])

  const handleDeleteRows = () => {
    const newValues = field.value.filter((_: any, index: number) => !selected.includes(index));
    //selected.forEach((index) => deleteFn(index));
    helpers.setValue(newValues);
    setSelected([]);
  };

  const renderCell = (_row: any, index: number, fieldDefinition: FieldConfig) => {
    // if (fieldDefinition.render) {
    //   return fieldDefinition.render(row[fieldDefinition?.id]);
    // } else  // TODO: Implement

    if (fieldDefinition.definition === 'select') {
      return (
        <Select
          name={`${fieldName}.${index}.${fieldDefinition?.id}`}
          field={fieldDefinition}
        />
      );
    } else if (fieldDefinition.definition === 'autocomplete') {
      return (
        <Autocomplete
          name={`${fieldName}.${index}.${fieldDefinition?.id}`}
          field={fieldDefinition}
        />
      );
    }
    return (
      <TextField
        name={`${fieldName}.${index}.${fieldDefinition?.id}`}
        field={fieldDefinition}
        // field={fieldConfig}
      />
    );
  };

  console.log(columns, getTemplate());

  // const handleDeleteRow = (rowId: number) => {
  //   setRows(rows.filter((row: any) => row.id !== rowId));
  // };

  return (
    <FieldArray name={fieldName as string}>
      {({ remove, push }) => (
        <>
          <Toolbar>
            {selectable && selected.length > 0 && (
              <Tooltip title="Delete Selected">
                <IconButton
                  onClick={handleDeleteRows}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
            <Typography
              variant="h6"
              id="tableTitle"
            >
              {selected.length > 0
                ? `${selected.length} selected`
                : title || fieldConfig?.label || 'Table'}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              style={{ marginLeft: 'auto' }}
            >
              {' '}
              {editable && (
                <Tooltip title="Add Row">
                  <IconButton
                    onClick={() => (getTemplate ? push(getTemplate()) : push(template || {}))}
                    color="primary"
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              )}
              {/* {editable && (
                <Tooltip title="Save">
                  <span>
                    <IconButton
                      onClick={formik.handleSubmit}
                      color="primary"
                      disabled={!formik.dirty || !formik.isValid}
                    >
                      <SaveIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              )} */}
            </Stack>
          </Toolbar>
          <TableContainer>
            <DTable size="small">
              <TableHead>
                <MUITableRow>
                  {Object.keys(columns).map((column, index) => (
                    <TableCell key={index}>{columns[column].label}</TableCell>
                  ))}
                  {(editable || selectable) && <TableCell>Actions</TableCell>}
                </MUITableRow>
              </TableHead>
              <TableBody>
                {field.value.map((row: any, index: number) => (
                  <React.Fragment key={index}>
                    <MUITableRow key={index}>
                      {Object.keys(columns).map((column, columnIndex) => {
                        const tableCellProps = columns[column]?.custom?.muiTableCellProps || {};
                        return (
                          <TableCell
                            key={columnIndex}
                            {...tableCellProps}
                          >
                            {renderCell(row, index, columns[column])}
                            {/* <TextField name={`${fieldName}.${index}.${column.key}`} /> */}
                          </TableCell>
                        );
                      })}
                      {(editable || selectable) && (
                        <TableCell>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => remove(index)}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </MUITableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </DTable>
          </TableContainer>
        </>
      )}
    </FieldArray>
  );
};

export default Table;
