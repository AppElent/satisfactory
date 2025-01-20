import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import ClearIcon from '@mui/icons-material/Clear';
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListProps,
  TextField,
} from '@mui/material';
import _ from 'lodash';
import { useMemo, useState } from 'react';

interface CustomCheckboxListProps {
  name?: string;
  field?: FieldConfig;
  muiListProps?: ListProps;
  options?: CustomCheckboxListOptions;
}

interface CustomCheckboxListOptions {
  search?: boolean;
  selectAll?: boolean;
  selectNone?: boolean;
  inverted?: boolean;
}

const defaultOptions: CustomCheckboxListOptions = {
  search: false,
  selectAll: false,
  selectNone: false,
  inverted: false,
};

const IconComponent: React.FC<{ imageUrl: string; alt: string }> = ({ imageUrl, alt }) => (
  <Box sx={{ width: 40, height: 40 }}>
    <img
      src={imageUrl}
      alt={alt}
      width={30}
      height={30}
    />
  </Box>
);

const CheckboxList = ({ name, field: fieldConfig, options }: CustomCheckboxListProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const [searchQuery, setSearchQuery] = useState('');
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string, fieldConfig);
  const { field, helpers } = data;

  // spread options
  const { search, selectAll, selectNone, inverted } = _.merge({}, defaultOptions, options);

  console.log(fieldName, name, fieldConfig, options);

  const optionList = fieldConfig?.options || [];
  const checkedItems = useMemo(() => {
    return new Set(field.value || []);
  }, [field.value]);
  console.log(checkedItems, field.value, field.checked);
  //const [checkedItems, setCheckedItems] = useState(new Set(field.value || []));

  // useEffect(() => {
  //   const newCheckedItems = new Set(field.value || []);
  //   if (!_.isEqual(Array.from(newCheckedItems), Array.from(checkedItems))) {
  //     setCheckedItems(newCheckedItems);
  //   }
  // }, [field.value, checkedItems]);

  // const label = fieldConfig?.translationKey
  //   ? t(fieldConfig?.translationKey, { defaultValue: fieldConfig?.label || fieldName })
  //   : fieldConfig?.label || name;)

  const handleToggle = (key: string) => {
    const newCheckedItems = new Set(field.value || []);

    if (newCheckedItems.has(key)) {
      newCheckedItems.delete(key);
    } else {
      newCheckedItems.add(key);
    }

    helpers.setValue(Array.from(newCheckedItems));
  };

  const filteredOptions = optionList.filter(
    (item) =>
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {(search || selectAll || selectNone) && (
        <Box
          display="flex"
          alignItems="center"
          mb={2}
        >
          {search && (
            <TextField
              label="Search"
              variant="outlined"
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              sx={{ mr: 1 }}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchQuery('')}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
          {selectAll && (
            <Button
              variant="contained"
              onClick={() => {
                helpers.setValue(optionList.map((item) => item.key));
              }}
            >
              Select all
            </Button>
          )}
          {selectNone && (
            <Button
              onClick={() => {
                helpers.setValue([]);
              }}
            >
              Select none
            </Button>
          )}
        </Box>
      )}
      <List
        sx={{
          width: '100%',
          bgcolor: 'background.paper',
        }}
      >
        {filteredOptions.map((item) => {
          const labelId = `checkbox-list-label-${item.key}`;
          const itemIsChecked = () => {
            let isChecked = false;
            if (checkedItems.has(item.key)) {
              isChecked = true;
            }
            if (inverted) {
              isChecked = !isChecked;
            }
            // console.log(item.key, isChecked, inverted);
            return isChecked;
          };
          itemIsChecked();

          return (
            <ListItem
              key={item.key}
              disablePadding
              onClick={() => handleToggle(item.key)}
              secondaryAction={item.secondaryAction}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                },
              }}
              // secondaryAction={}
            >
              <ListItemButton
                role={undefined}
                dense
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={itemIsChecked()} //{inverted ? !checkedItems.has(item.key) : checkedItems.has(item.key)}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': labelId }}
                  />
                </ListItemIcon>
                {item.img && (
                  <ListItemIcon>
                    <IconComponent
                      imageUrl={item.img}
                      alt={item.label}
                    />
                  </ListItemIcon>
                )}
                <ListItemText
                  id={labelId}
                  primary={item.label}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );
};

export default CheckboxList;
