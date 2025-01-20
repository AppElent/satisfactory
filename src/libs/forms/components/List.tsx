import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Box,
  IconButton,
  ListItemProps,
  ListItemSecondaryAction,
  ListItemText,
  ListItemTextProps,
  ListProps,
  List as MUIList,
  ListItem as MUIListItem,
  Stack,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material';
import { FieldArray, useField } from 'formik';
import _ from 'lodash';

type CustomListProps = {
  name?: string;
  field?: FieldConfig;
  muiListProps?: ListProps;
  muiListItemProps?: ListItemProps;
  muiListItemTextProps?: ListItemTextProps;
  muiTextFieldProps?: TextFieldProps;
};

interface CustomListItemProps extends CustomListProps {
  name: string;
  index: number;
  remove: () => void;
}

const ListItem = ({ name, index, remove, ...props }: CustomListItemProps) => {
  const [field, meta] = useField(name);
  return (
    <MUIListItem
      key={index}
      {...props?.muiListItemProps}
    >
      <ListItemText
        style={{ margin: 0 }}
        {...(props && props?.muiListItemTextProps)}
      >
        <TextField
          fullWidth
          margin="dense"
          {...field}
          {...props}
          value={field.value || ''}
          error={meta.touched && Boolean(meta.error)}
          helperText={meta.touched && meta.error}
          {...props?.muiTextFieldProps}
        />
      </ListItemText>
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={() => remove()}
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </MUIListItem>
  );
};

/**
 * List component to render a reorderable list with formik integration
 *
 * @param {CustomListProps} props - The properties for the List component
 * @returns {JSX.Element} The rendered List component
 */
const List = ({ name, field: fieldConfig, ...props }: CustomListProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string);
  const { options, field, helpers } = data;

  const newProps = _.merge({}, options, props);

  /**
   * Handles the drag end event to reorder the list items
   *
   * @param {DropResult} result - The result of the drag event
   */
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(field.value);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    helpers.setValue(items);
  };

  return (
    <FieldArray name={fieldName as string}>
      {({ remove, push }) => (
        <>
          <Stack
            direction="row"
            alignItems={'flex-end'}
          >
            <IconButton
              onClick={() => push('')}
              style={{ marginLeft: '8px' }}
              color="primary"
            >
              <AddIcon />
            </IconButton>
            <Typography variant="h6">{fieldConfig?.label || fieldName}</Typography>
          </Stack>
          {fieldConfig?.custom?.reorderable ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="droppable-list">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ overflow: 'auto' }} // Ensure scrolling is handled here
                  >
                    <MUIList
                      dense
                      {...newProps?.muiListProps}
                    >
                      {field.value?.map((_item: any, index: number) => (
                        <Draggable
                          key={index}
                          draggableId={`${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <Stack
                              direction={'row'}
                              alignItems={'center'}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <DragIndicatorIcon style={{ cursor: 'grab', marginRight: '8px' }} />
                              <Box flex={1}>
                                <ListItem
                                  name={`${field.name}.${index}`}
                                  index={index}
                                  remove={() => remove(index)}
                                  {...newProps?.muiListItemProps}
                                />
                              </Box>
                            </Stack>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </MUIList>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <MUIList
              dense
              {...newProps?.muiListProps}
            >
              {field.value?.map((_item: any, index: number) => (
                <div
                  key={index}
                  //style={{ display: 'flex', alignItems: 'center' }}
                >
                  <ListItem
                    name={`${field.name}.${index}`}
                    index={index}
                    remove={() => remove(index)}
                    {...newProps?.muiListItemProps}
                  />
                </div>
              ))}
            </MUIList>
          )}
        </>
      )}
    </FieldArray>
  );
};

export default List;
