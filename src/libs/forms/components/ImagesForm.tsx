import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Box, Button, Card, CardActions, CardMedia, IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';

interface ImageData {
  id: string;
  url: string;
  isDefault: boolean;
}

const ImagesForm: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const newImages = filesArray.map((file) => ({
        id: URL.createObjectURL(file),
        url: URL.createObjectURL(file),
        isDefault: images.length === 0, // First uploaded image is default
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleDelete = (id: string) => {
    setImages((prev) => {
      const updatedImages = prev.filter((img) => img.id !== id);
      if (updatedImages.every((img) => !img.isDefault)) {
        updatedImages[0].isDefault = true; // Set first image as default if none exists
      }
      return updatedImages;
    });
  };

  const handleSetDefault = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isDefault: img.id === id,
      }))
    );
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
        {images.map((image) => (
          <Card
            key={image.id}
            sx={{ width: 150 }}
          >
            <CardMedia
              component="img"
              height="100"
              image={image.url}
              alt="Uploaded Image"
            />
            <CardActions>
              {/* Set Default */}
              <IconButton
                color={image.isDefault ? 'primary' : 'default'}
                onClick={() => handleSetDefault(image.id)}
                disabled={image.isDefault}
              >
                {image.isDefault ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
              {/* Delete */}
              <IconButton
                color="error"
                onClick={() => handleDelete(image.id)}
                disabled={image.isDefault}
              >
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default ImagesForm;
