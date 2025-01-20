import ImageCropper from '@/components/default/images/image-cropper';
import useDialog from '@/hooks/use-dialog';
import { useAuth } from '@/libs/auth';
import FirebaseStorageProvider from '@/libs/storage-providers/providers/FirebaseStorageProvider';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';

const SimpleCropper = ({ filename }: { filename: string }) => {
  const storageClass = new FirebaseStorageProvider({} as any, { instance: {} });
  const auth = useAuth();
  const dialog = useDialog();
  const [imageUrl, setImageUrl] = useState<string>();
  console.log(auth);
  const [url, setUrl] = useState('');

  return (
    <>
      <TextField
        id="outlined-controlled"
        label="URL"
        value={url}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setUrl(event.target.value);
        }}
      />
      <Button onClick={() => dialog.open()}>Crop</Button>
      <ImageCropper
        imageUrl={url}
        filename={filename}
        onSave={async (file, path) => {
          console.log(path, file);
          // Save the original file to storage
          const originalFileUrl = await storageClass.uploadFile(file, filename);
          //console.log('Original file uploaded:', originalFileUrl);
          // update state with the type url
          //setImageUrl((prev: any) => ({ ...prev, [type]: originalFileUrl }));
          setImageUrl(originalFileUrl);
          return originalFileUrl;
          return path;
        }}
        dialog={{
          isOpen: dialog.isOpen,
          close: dialog.close,
        }}
      />
      {imageUrl && (
        // Show image with max size of 200px
        <Box>
          <Typography variant="h6">Cropped image</Typography>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={imageUrl}
              alt="Uploaded file"
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
          </a>
        </Box>
      )}
    </>
  );
};

export default SimpleCropper;
