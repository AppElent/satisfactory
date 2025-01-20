 
export interface StorageClassOptions {
  [key: string]: any;
}

export default class BaseStorageProvider {
  options: StorageClassOptions;
  providerOptions: any;

  constructor(options: any, providerOptions?: any) {
    this.options = options;
    this.providerOptions = providerOptions;
    this.uploadFile = this.uploadFile.bind(this);
    this.getFile = this.getFile.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
  }

  errors = {
    notFound: 'The requested file was not found.',
    unauthorized: 'You are not authorized to perform this action.',
    canceled: 'The operation was canceled.',
    unknown: 'An unknown error occurred.',
    quotaExceeded: 'Quota on your Firebase Storage has been exceeded.',
    retryLimitExceeded: 'The maximum time limit on an operation has been exceeded.',
    invalidChecksum:
      'File on the client does not match the checksum of the file received by the server.',
    invalidEventName: 'Invalid event name provided. Must be one of [`state_changed`].',
    invalidUrl: 'Invalid URL provided to refFromURL().',
    noDefaultBucket:
      'No default bucket found. Did you set the storageBucket property when initializing Firebase?',
    noDownloadUrl: 'No download URL found for the file.',
    unauthenticated: 'User is unauthenticated. Authenticate and try again.',
    cannotSliceBlob: 'Cannot slice blob for upload. Please retry the upload.',
    serverFileWrongSize: 'File on the server is not the same size as the file on the client.',
  };

  // You can also add helper methods that could be useful across storage classes.
  formatFilePath(path: string): string {
    // Example of a shared helper method
    return path.startsWith('/') ? path : `/${path}`;
  }

  async uploadFile(_file: File, _path: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async listFiles(_path: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getFile(_fileId: string): Promise<File> {
    throw new Error('Method not implemented.');
  }

  async deleteFile(_fileId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
