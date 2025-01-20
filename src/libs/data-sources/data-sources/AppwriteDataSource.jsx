export class AppwriteDataSource {
  constructor(databaseId, collectionId) {
    this.provider = 'Appwrite';
    this.databaseId = databaseId;
    this.collectionId = collectionId;
  }

  async get(id) {
    try {
      const response = await database.getDocument(this.databaseId, this.collectionId, id);
      return response;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getAll(filter = {}) {
    try {
      const filterQueries = Object.keys(filter).map((key) => `${key}=${filter[key]}`);

      const response = await database.listDocuments(this.databaseId, this.collectionId, {
        filters: filterQueries,
      });
      return response.documents;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async add(item) {
    try {
      const response = await database.createDocument(
        this.databaseId,
        this.collectionId,
        'unique()',
        item
      );
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async delete(id) {
    try {
      await database.deleteDocument(this.databaseId, this.collectionId, id);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      await database.updateDocument(this.databaseId, this.collectionId, id, data);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  subscribe(callback) {
    const unsubscribe = realtime.subscribe(
      [`databases.${this.databaseId}.collections.${this.collectionId}.documents`],
      async (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*')) {
          const updatedData = await this.getAll();
          callback(updatedData);
        }
      }
    );

    return () => unsubscribe();
  }
}
