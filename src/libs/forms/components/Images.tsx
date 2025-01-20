import { FieldConfig } from '@/libs/forms';
import useFormField from '@/libs/forms/use-form-field';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CropIcon from '@mui/icons-material/Crop';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
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

interface ImagesProps {
  name?: string;
  field?: FieldConfig;
  uploadImage: (file: File) => Promise<string>;
  deleteImage?: (url: string) => Promise<void>;
  postProcess?: () => Promise<any>;
  getFavorite?: (url: string) => boolean;
  setFavorite?: (url: string) => void;
  cropImage: (url: string) => Promise<string>;
}

const Images = ({
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
}: ImagesProps) => {
  if (!name && !fieldConfig) {
    throw new Error('Either name or field must be provided');
  }
  const fieldName = name || fieldConfig?.name;
  const data = useFormField(fieldName as string, fieldConfig);
  const { options, field, helpers } = data;
  const [cropperUrl, setCropperUrl] = useState<string | undefined>(undefined);

  // Set images variable
  let images = field.value || [];
  // If images is not an array, set it to an empty array
  if (!Array.isArray(images)) {
    images = [images];
  }

  const newProps = _.merge({}, options, props);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Determine if these are the first images uploaded
      const filesArray = Array.from(event.target.files);
      // for (const file of filesArray) {
      //   const url = await uploadImage(file);
      //   const images = field.value || [];
      //   if (images.indexOf(url) === -1) images.push(url);
      //   helpers.setValue(images);
      // }

      // // If postProcess is defined, run it
      // if (postProcess) {
      //   await postProcess();
      // }

      const newImages = filesArray.map((file) => URL.createObjectURL(file));
      // merge newImages with existing images and remove duplicates
      const uniqueImages = [...new Set([...images, ...newImages])];

      helpers.setValue(uniqueImages);
    }
  };

  const handleDelete = (id: string) => {
    if (deleteImage) {
      deleteImage(id);
    }
    const newValue = field.value.filter((img: string) => img !== id);
    helpers.setValue(newValue);
    // helpers.setValue((prev: string[]) => {
    //   const updatedImages = prev.filter((img) => img.id !== id);
    //   if (updatedImages.every((img) => !img.isDefault)) {
    //     updatedImages[0].isDefault = true; // Set first image as default if none exists
    //   }
    //   return updatedImages;
    // });
  };

  const handleSetFavorite = (id: string) => {
    if (setFavorite) {
      setFavorite(id);
    }
    // setImages((prev) =>
    //   prev.map((img) => ({
    //     ...img,
    //     isDefault: img.id === id,
    //   }))
    // );
  };

  return (
    <Box>
      <Typography
        variant="h6"
        gutterBottom
      >
        Upload Images
      </Typography>

      {/* Upload Button */}
      <Button
        variant="contained"
        component="label"
        startIcon={<AddPhotoAlternateIcon />}
        {...newProps?.muiButtonProps}
      >
        Upload Images
        <input
          type="file"
          accept="image/*"
          multiple
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
        {images.map((image: string) => (
          <Card
            key={image}
            sx={{ width: 150 }}
          >
            <CardMedia
              component="img"
              height="100"
              image={image}
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

              {/* Set Favorite */}
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
              )}

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
        ))}
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
            const imagesWithoutUrl = images.filter((img: string) => img !== cropperUrl);
            const newValues = [...new Set([...imagesWithoutUrl, url])];
            helpers.setValue(newValues);
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

export default Images;
