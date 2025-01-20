import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CropIcon from '@mui/icons-material/Crop';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardMedia,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import _ from 'lodash';
import { useState } from 'react';
import ImageCropper from '../../../components/default/images/image-cropper';

interface ImageProps {
  name?: string;
  field?: FieldConfig;
  uploadImage?: (file: File) => Promise<string>;
  deleteImage?: (url: string) => Promise<void>;
  postProcess?: () => Promise<any>;
  getFavorite?: (url: string) => boolean;
  setFavorite?: (url: string) => void;
  cropImage?: (url: string) => Promise<string>;
}

const Image = ({
  name,
  field: fieldConfig,
  // favorite: {
  //   get: getFavorite,
  //   set: setFavorite
  // },
  uploadImage,
  deleteImage,
  postProcess,
  getFavorite,
  setFavorite,
  cropImage,
  ...props
}: ImageProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string, fieldConfig);
  const { options, field, helpers } = data;
  const [cropperUrl, setCropperUrl] = useState<string | undefined>(undefined);

  const newProps = _.merge({}, options, props);

  const image = field.value || '';

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Determine if these are the first images uploaded
      const filesArray = Array.from(event.target.files);
      const file = filesArray[0];
      const url = URL.createObjectURL(file);
      helpers.setValue(url);
    }
  };

  const handleDelete = (id: string) => {
    if (deleteImage) {
      deleteImage(id);
    }
    helpers.setValue('');
  };

  return (
    <Box>
      <Typography
        variant="h6"
        gutterBottom
      >
        Upload Image
      </Typography>

      {/* Upload Button */}
      <Button
        variant="contained"
        component="label"
        startIcon={<AddPhotoAlternateIcon />}
        {...newProps?.muiButtonProps}
      >
        Upload Image
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleUpload}
        />
      </Button>

      {/* Display Images */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap={2}
        mt={3}
        justifyContent="flex-start"
      >
        <Card
          key={image}
          sx={{ width: 300 }}
        >
          <CardMedia
            component="img"
            height="200"
            image={image ? image : '/app/Image_not_available.png'}
            alt="Uploaded Image"
          />
          <CardActions style={{ justifyContent: 'flex-end' }}>
            {/* Crop image */}
            {!!cropImage && (
              <Tooltip
                title="Crop Image"
                placement="top"
              >
                <IconButton
                  color="primary"
                  onClick={() => setCropperUrl(image)}
                  // disabled={image.isDefault}
                >
                  <CropIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Set Favorite
            {getFavorite && (
              <Tooltip
                title="Set as Favorite"
                placement="top"
              >
                <IconButton
                  // color={image.isDefault ? 'primary' : 'default'}
                  onClick={() => handleSetFavorite(image)}
                  //disabled={image}
                >
                  {getFavorite(image) ? (
                    <StarIcon style={{ color: '#faaf00' }} />
                  ) : (
                    <StarBorderIcon />
                  )}
                </IconButton>
              </Tooltip>
            )} */}

            {/* Delete */}
            {deleteImage && (
              <Tooltip
                title="Delete"
                placement="top"
              >
                <IconButton
                  color="error"
                  onClick={() => handleDelete(image)}
                  // disabled={image.isDefault}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </CardActions>
        </Card>
      </Box>
      {cropperUrl && (
        <ImageCropper
          dialog={{ isOpen: !!cropperUrl, close: () => setCropperUrl(undefined) }}
          imageUrl={cropperUrl || ''}
          // Filename is same as original URL, but with _cropped appended before the extension
          filename={cropperUrl}
          onSave={async (file, _path) => {
            // const url = await uploadImage(file);
            // const newValue = field.value || [];
            // helpers.setValue([...newValue, url]);
            // setCropperUrl(undefined);
            // return url;
            const url = URL.createObjectURL(file);
            helpers.setValue(url);
            return url;
          }}
          cropperProps={{
            aspect: 16 / 9,
          }}
        />
      )}
    </Box>
  );
};

export default Image;
