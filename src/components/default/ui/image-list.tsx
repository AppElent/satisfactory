import { ImageList as DefaultImageList, ImageListItem } from '@mui/material';

interface ImageListProps {
  images: string[];
  onClick: (image: string) => void;
}

const ImageList = ({ images, onClick }: ImageListProps) => {
  return (
    <DefaultImageList
      cols={images?.length}
      gap={8}
      rowHeight={160}
    >
      {images.map((src: string, index: number) => (
        <ImageListItem key={index}>
          <img
            src={src}
            alt={`Image ${index + 1}`}
            loading="lazy"
            onClick={() => onClick(src)}
            style={{
              width: 150,
              height: 150,
              objectFit: 'cover',
              cursor: 'pointer',
            }}
          />
        </ImageListItem>
      ))}
    </DefaultImageList>
  );
};

export default ImageList;
