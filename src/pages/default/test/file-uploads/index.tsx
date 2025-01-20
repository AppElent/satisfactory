// @ts-nocheck

import { useAuth } from '@/libs/auth';
import FirebaseStorageProvider from '@/libs/storage-providers/providers/FirebaseStorageProvider';
import DefaultPage from '@/pages/default/DefaultPage';
import ImageUploaderCard from '@/pages/default/test/file-uploads/_components/image-uploader-card';
import SimpleCropper from '@/pages/default/test/file-uploads/_components/simple-cropper';
import { Card, CardContent, CardHeader, Grid } from '@mui/material';

const CardLayout = ({ title, children }) => {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>{children}</CardContent>
    </Card>
  );
};

const FileUploads = () => {
  const storageClass = new FirebaseStorageProvider({} as any, { instance: {} });
  const auth = useAuth();

  return (
    <DefaultPage>
      <Grid
        container
        spacing={3}
      >
        <Grid
          item
          xs={12}
          md={6}
        >
          <CardLayout title="Image uploader with cropping and thumbnail">
            <ImageUploaderCard
              title="Image uploader with cropping and thumbnail"
              uploadFile={storageClass.uploadFile}
              uploadOriginal={true}
              uploadCropped={true}
              uploadThumbnail={true}
              originalFileName={`uploads/test/${auth.user?.id || 'unknown'}/original/testimage.jpg`}
              croppedFileName={`uploads/test/${auth.user?.id || 'unknown'}/cropped/testimage.jpg`}
              thumbnailFileName={`uploads/test/${auth.user?.id || 'unknown'}/thumbnail/testimage.jpg`}
            />
          </CardLayout>
        </Grid>
        <Grid item>
          <CardLayout title="Simple Cropper">
            <SimpleCropper
              filename={`uploads/test/${auth.user?.id || 'unknown'}/simplecropper/testimage.jpg`}
            />
          </CardLayout>
        </Grid>
      </Grid>
    </DefaultPage>
  );
};

export default FileUploads;
