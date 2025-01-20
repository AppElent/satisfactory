const createThumbnail = async (file: File) => {
  const img = document.createElement('img');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise((resolve) => {
    img.onload = () => {
      const scaleSize = 100 / img.width;
      canvas.width = 100;
      canvas.height = img.height * scaleSize;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg');
    };
    img.src = URL.createObjectURL(file);
  });
};

export default createThumbnail;
