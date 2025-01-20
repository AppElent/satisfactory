import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  Paper,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

/**
 * CustomTable component to display a table with editable rows, add, delete, and save functionalities.
 *
 * @param {string} title - Title of the table.
 * @param {Object[]} data - The data to display in the table.
 * @param {Object[]} columns - The column definitions for the table.
 * @param {Function} presave - Function to validate the edited values before saving.
 * @param {Function} save - Function to save the edited values.
 * @param {boolean} editable - Flag to determine if the rows are editable.
 * @param {boolean} selectable - Flag to determine if the rows can be selected.
 * @param {Function} getRowId - Function to get the unique identifier for a row.
 * @param {Function} deleteFn - Function to delete a row.
 * @param {boolean} dense - Flag to determine if the table should be dense.
 */
const CustomTable = ({
  title,
  data,
  columns,
  presave,
  save,
  editable,
  selectable,
  deleteFn,
  dense,
}) => {
  const [selected, setSelected] = useState([]);

  const validationSchema = Yup.array().of(
    Yup.object().shape(
      columns.reduce((acc, column) => {
        let schema = Yup.string(); // Default to string type
        if (column.type === 'text') {
          schema = Yup.string();
        } else if (column.type === 'select') {
          schema = Yup.string().oneOf(
            column.options.map((option) => column.getOptionValue(option))
          );
        } else if (column.type === 'autocomplete') {
          schema = Yup.string();
        }
        if (column.required) {
          schema = schema.required(`${column.label} is required`);
        }
        if (column.unique) {
          schema = schema.test('unique', `${column.label} must be unique`, function (value) {
            const { options } = this;
            const values = options.context;
            const uniqueValues = values.map((row) => row[column.accessor]);
            return uniqueValues.filter((v) => v === value).length <= 1;
          });
        }
        acc[column.accessor] = schema;
        return acc;
      }, {})
    )
  );

  const formik = useFormik({
    initialValues: data,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    context: data,
    onSubmit: (values, submitProps) => {
      values = presave ? presave(values) : values;
      save(values);
      submitProps.resetForm({ values });
    },
  });

  console.log(formik);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = formik.values.map((_, index) => index);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, index) => {
    const selectedIndex = selected.indexOf(index);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, index);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleAddRow = () => {
    const newRow = columns.reduce((acc, column) => {
      acc[column.accessor] =
        typeof column.defaultValue === 'function' ? column.defaultValue() : column.defaultValue;
      return acc;
    }, {});
    formik.setFieldValue(formik.values.length, newRow);
  };

  const handleDeleteRows = () => {
    const newValues = formik.values.filter((_, index) => !selected.includes(index));
    selected.forEach((index) => deleteFn(index));
    formik.setValues(newValues);
    setSelected([]);
  };

  const handleDeleteRow = (index, event) => {
    event.stopPropagation();
    const newValues = formik.values.filter((_, i) => i !== index);
    formik.setValues(newValues);
    deleteFn(index);
  };

  const renderCell = (row, column, index) => {
    if (!editable) {
      return typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor];
    }

    if (column.render) {
      return column.render(row, column, index, formik);
    }

    switch (column.type) {
      case 'text':
        return (
          <TextField
            name={`${index}.${column.accessor}`}
            value={formik.values[index][column.accessor] || ''}
            onChange={formik.handleChange}
            error={
              formik.touched[index]?.[column.accessor] &&
              Boolean(formik.errors[index]?.[column.accessor])
            }
            helperText={
              formik.touched[index]?.[column.accessor] && formik.errors[index]?.[column.accessor]
            }
            onClick={(e) => e.stopPropagation()}
            sx={{ width: '100%' }}
          />
        );
      case 'select':
        return (
          <Select
            name={`${index}.${column.accessor}`}
            value={formik.values[index][column.accessor] || ''}
            onChange={(e) => {
              formik.handleChange(e);
              formik.validateForm();
            }}
            error={
              formik.touched[index]?.[column.accessor] &&
              Boolean(formik.errors[index]?.[column.accessor])
            }
            onClick={(e) => e.stopPropagation()}
            sx={{ width: '100%' }}
            size={dense ? 'small' : undefined}
          >
            {column.options.map((option) => (
              <MenuItem
                key={column.getOptionKey ? column.getOptionKey(option) : option.value}
                value={column.getOptionValue ? column.getOptionValue(option) : option.value}
              >
                {column.getOptionLabel ? column.getOptionLabel(option) : option.label}
              </MenuItem>
            ))}
          </Select>
        );
      case 'autocomplete':
        return (
          <Autocomplete
            options={column.options}
            getOptionLabel={column.getOptionLabel || null}
            value={formik.values[index][column.accessor] || ''}
            onChange={(e, newValue) => {
              formik.setFieldValue(`${index}.${column.accessor}`, newValue);
              formik.validateForm();
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                error={
                  formik.touched[index]?.[column.accessor] &&
                  Boolean(formik.errors[index]?.[column.accessor])
                }
                helperText={
                  formik.touched[index]?.[column.accessor] &&
                  formik.errors[index]?.[column.accessor]
                }
                onClick={(e) => e.stopPropagation()}
              />
            )}
            sx={{ width: '100%' }}
          />
        );
      default:
        return typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor];
    }
  };

  const isSelected = (index) => selected.indexOf(index) !== -1;

  return (
    <Paper>
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
          {selected.length > 0 ? `${selected.length} selected` : title}
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
                onClick={handleAddRow}
                color="primary"
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
          {editable && (
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
          )}
        </Stack>
      </Toolbar>
      <TableContainer>
        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < formik.values.length}
                    checked={formik?.values?.length > 0 && selected.length === formik.values.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.label}
                  style={{ width: column.width }}
                >
                  {column.label}
                </TableCell>
              ))}
              {(editable || selectable) && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {formik.values.map((row, index) => {
              const isItemSelected = isSelected(index);
              return (
                <TableRow
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={index}
                  selected={isItemSelected}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onClick={(event) => selectable && handleClick(event, index)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={column.label}
                      style={{ width: column.width }}
                    >
                      {renderCell(row, column, index)}
                    </TableCell>
                  ))}
                  {(editable || selectable) && (
                    <TableCell>
                      <IconButton onClick={(event) => handleDeleteRow(index, event)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

CustomTable.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      accessor: PropTypes.string,
      type: PropTypes.oneOf(['text', 'select', 'autocomplete']),
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.any,
          label: PropTypes.string,
        })
      ),
      getOptionLabel: PropTypes.func,
      getOptionKey: PropTypes.func,
      getOptionValue: PropTypes.func,
      defaultValue: PropTypes.oneOfType([PropTypes.any, PropTypes.func]),
      width: PropTypes.string, // Add width property
      unique: PropTypes.bool, // Add unique property
      required: PropTypes.bool, // Add required property
    })
  ).isRequired,
  presave: PropTypes.func,
  save: PropTypes.func,
  editable: PropTypes.bool,
  selectable: PropTypes.bool,
  deleteFn: (props, propName, componentName) => {
    if (
      (props.editable || props.selectable) &&
      (props[propName] === undefined || typeof props[propName] !== 'function')
    ) {
      return new Error(
        `${propName} is required and should be a function when editable or selectable is true in ${componentName}.`
      );
    }
  },
  dense: PropTypes.bool, // Add dense property
};

export default CustomTable;
