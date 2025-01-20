import ImageUploader from '@/components/default/images/image-uploader';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';

const ImageUploaderCard = ({
  uploadFile,
  originalFileName,
  croppedFileName,
  thumbnailFileName,
}: any) => {
  const [imageUrl, setImageUrl] = useState<any>({});
  const uploadFileAndShowThumbnail = (type: string) => async (file: File, fileName: string) => {
    // Save the original file to storage
    const originalFileUrl = await uploadFile(file, fileName);
    //console.log('Original file uploaded:', originalFileUrl);
    // update state with the type url
    setImageUrl((prev: any) => ({ ...prev, [type]: originalFileUrl }));
    return originalFileUrl;
  };

  console.log(imageUrl);
  return (
    <>
      <ImageUploader
        originalFileName={originalFileName}
        crop={{
          uploadFile: uploadFileAndShowThumbnail('cropped'),
          path: croppedFileName,
          props: { aspect: 16 / 9 },
        }}
        thumbnail={{
          uploadFile: uploadFileAndShowThumbnail('thumbnail'),
          path: thumbnailFileName,
          dimensions: { width: 100, height: 100 },
        }}
        uploadFile={uploadFileAndShowThumbnail('original')}
      />
      {imageUrl.original && (
        // Show image with max size of 200px
        <Box>
          <Typography variant="h6">Original image</Typography>
          <a
            href={imageUrl.original}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={imageUrl.original}
              alt="Uploaded file"
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
          </a>
        </Box>
      )}
      {imageUrl.cropped && (
        // Show image with max size of 200px
        <Box>
          <Typography variant="h6">Cropped image</Typography>
          <a
            href={imageUrl.cropped}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={imageUrl.cropped}
              alt="Uploaded file"
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
          </a>
        </Box>
      )}
      {imageUrl.thumbnail && (
        // Show image with max size of 200px
        <Box>
          <Typography variant="h6">Thumbnail image</Typography>
          <a
            href={imageUrl.thumbnail}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={imageUrl.thumbnail}
              alt="Uploaded file"
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
          </a>
        </Box>
      )}
    </>
  );
};

export default ImageUploaderCard;
