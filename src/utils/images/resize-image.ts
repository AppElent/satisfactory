const resizeImage = (file: File, maxSize: number): Promise<File> => {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const scaleSize = maxSize / img.width;
      canvas.width = maxSize;
      canvas.height = img.height * scaleSize;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }
      }, 'image/jpeg');
    };
    img.src = URL.createObjectURL(file);
  });
};

export default resizeImage;
