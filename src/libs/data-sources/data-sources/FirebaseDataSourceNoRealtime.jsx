import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import BaseDataSource from './BaseDataSource';

export class FirebaseDataSourceNoRealtime extends BaseDataSource {
  constructor(options, providerConfig) {
    super(options, providerConfig);

    this.provider = 'FirestoreNoRealtime';
    // this.providerConfig = providerConfig;
    // this.options = {
    //   ...this.defaultOptions,
    //   ...options,
    // };
    this.firestore = providerConfig.db;
    //this.targetName = options.target;
    if (this.options.targetMode === 'collection') {
      this.ref = collection(this.firestore, this.targetName);
    } else if (this.options.targetMode === 'document') {
      this.ref = doc(this.firestore, this.targetName);
    }
  }

  // Get a single document by ID
  async get(id) {
    try {
      const docRef = doc(this.ref, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  // Get all documents in the collection, with optional filters
  async getAll(filter = {}) {
    try {
      if (this.options.targetMode !== 'collection')
        throw new Error('getAll() can only be used with collections');
      let q = this.ref;
      Object.keys(filter).forEach((key) => {
        q = query(q, where(key, '==', filter[key]));
      });

      const querySnapshot = await getDocs(q);
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Add a new document to the collection
  async add(item) {
    try {
      if (this.options.targetMode !== 'collection')
        throw new Error('add() can only be used with collections');
      // Validate new data
      this.validate(item);
      const docRef = await addDoc(this.ref, item);
      const newDoc = await getDoc(docRef);
      return { id: docRef.id, ...newDoc.data() };
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  // Update an existing document by ID
  async update(id, data) {
    try {
      // Validate updated data
      this.validate(data);
      const docRef = doc(this.ref, id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Update an existing document by ID
  async set(id, data) {
    try {
      // Validate updated data
      this.validate(data);
      const docRef = doc(this.ref, id);
      await setDoc(docRef, data);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete a document by ID
  async delete(id) {
    try {
      const docRef = doc(this.ref, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}

export default FirebaseDataSourceNoRealtime;
