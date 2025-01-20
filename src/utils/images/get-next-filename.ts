const getNextFileName = ({ filenames, name }: { filenames: string[]; name: string }) => {
  // const folderRef = ref(storage, folderPath);

  // // List all files in the folder
  // const result = await listAll(folderRef);
  // const filenames = result.items.map((item) => item.name);

  // Create a dynamic regex pattern based on the base name
  const regex = new RegExp(`${name}(\\d+)\\.`); // Example: image01, photo01, etc.

  // Extract numeric suffixes and find the highest number
  const numbers = filenames
    .map((name) => {
      const match = name.match(regex); // Match pattern like image01.jpg
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((num) => num !== null);

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

  console.log(name, numbers, nextNumber);

  // Format as zero-padded (e.g., 01, 02, ...)
  return `${name}${String(nextNumber).padStart(2, '0')}`;
};

export default getNextFileName;
