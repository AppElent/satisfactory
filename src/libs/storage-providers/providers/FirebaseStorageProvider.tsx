import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from 'firebase/storage';
import BaseStorageProvider, { StorageClassOptions } from './BaseStorageProvider';

class FirebaseStorageProvider extends BaseStorageProvider {
  constructor(options?: StorageClassOptions, providerOptions?: any) {
    super(options, providerOptions);
  }
  async uploadFile(file: File, path: string): Promise<string> {
    const storage = getStorage();
    const fileRef = ref(storage, this.formatFilePath(path));
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  async listFiles(path: string): Promise<any> {
    const storage = getStorage();
    const folderRef = ref(storage, this.formatFilePath(path));
    const files = await listAll(folderRef);
    return files.items;
  }

  async getFile(fileId: string): Promise<any> {
    const storage = getStorage();
    const fileRef = ref(storage, fileId);
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    return await response.blob();
  }

  async deleteFile(fileId: string): Promise<void> {
    const storage = getStorage();
    const fileRef = ref(storage, fileId);
    await deleteObject(fileRef);
  }

  handleError = (error: string) => {
    // Handle errors here
    const firebaseErrors: { [key: string]: string } = {
      'storage/object-not-found': this.errors.notFound,
      'storage/unauthorized': this.errors.unauthorized,
      'storage/canceled': this.errors.canceled,
      'storage/unknown': this.errors.unknown,
      'storage/quota-exceeded': this.errors.quotaExceeded,
      'storage/retry-limit-exceeded': this.errors.retryLimitExceeded,
      'storage/invalid-checksum': this.errors.invalidChecksum,
      'storage/invalid-event-name': this.errors.invalidEventName,
      'storage/invalid-url': this.errors.invalidUrl,
      'storage/no-default-bucket': this.errors.noDefaultBucket,
      'storage/no-download-url': this.errors.noDownloadUrl,
      'storage/unauthenticated': this.errors.unauthenticated,
      'storage/cannot-slice-blob': this.errors.cannotSliceBlob,
      'storage/server-file-wrong-size': this.errors.serverFileWrongSize,
    };
    return firebaseErrors[error] || 'An error occurred';
  };
}

export default FirebaseStorageProvider;
