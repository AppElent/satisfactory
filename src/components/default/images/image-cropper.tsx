// @ts-nocheck

import useIsMobile from '@/hooks/use-is-mobile';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';

interface ImageCropperProps {
  imageUrl: string;
  filename: string;
  onSave: (file: File, path: string) => Promise<string>;
  dialog?: {
    isOpen: boolean;
    close: () => void;
  };
  cropperProps?: any;
}

async function convertImageToDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const getCroppedImg = async (imageSrc: string, crop: any) => {
  const image = new Image();
  const dataUrl = await convertImageToDataURL(imageSrc);
  image.src = dataUrl;

  return new Promise((resolve) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');

      ctx?.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    };
  });
};

const ImageCropper = ({ imageUrl, filename, onSave, dialog, cropperProps }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Theme and media query
  const fullScreen = useIsMobile();

  const getFileName = (path: string): string => {
    return path.split('/').pop() || 'unknown-filename.jpg';
  };

  const onCropComplete = useCallback((_, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
    if (imageUrl && croppedAreaPixels) {
      const croppedImageBlob = await getCroppedImg(imageUrl, croppedAreaPixels);

      const croppedFile = new File([croppedImageBlob], getFileName(filename), {
        type: 'image/jpeg',
      });
      const croppedFileUrl = await onSave(croppedFile, filename);
      console.log('Cropped file uploaded:', croppedFileUrl);
      dialog?.close();
    }
  };

  return (
    <div>
      <Dialog
        open={dialog?.isOpen || false}
        onClose={() => dialog?.close()}
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen}
      >
        <DialogTitle
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box>Crop Image</Box>
          <IconButton
            onClick={dialog?.close} // Add your close handler here
            style={{ marginLeft: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {imageUrl && (
            <div style={{ position: 'relative', width: '100%', height: 400 }}>
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={cropperProps?.aspect || 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => dialog?.close()}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={saveCroppedImage}
            color="primary"
            variant="contained"
          >
            Save Image
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ImageCropper;
