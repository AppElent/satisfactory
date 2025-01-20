import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import BaseDataSource from './BaseDataSource';
import FirebaseDataSourceNoRealtime from './FirebaseDataSourceNoRealtime';

export class FirebaseDataSource extends FirebaseDataSourceNoRealtime {
  constructor(options, providerConfig) {
    super(options, providerConfig);

    this.provider = 'Firestore';
    // this.providerConfig = providerConfig;
    // this.options = {
    //   ...this.defaultOptions,
    //   ...options,
    // };
    // this.firestore = providerConfig.db;
    // this.targetName = options.target;
    // if (this.options.targetMode === 'collection') {
    //   this.ref = collection(this.firestore, this.targetName);
    // } else if (this.options.targetMode === 'document') {
    //   this.ref = doc(this.firestore, this.targetName);
    // }
  }

  // _parseFilters = (filters) => {
  //   const parsedFilters = [];
  //   Object.keys(filters).forEach((key) => {
  //     parsedFilters.push({ field: key, operator: '==', value: filters[key] });
  //   });
  //   return parsedFilters;
  // };

  // // Get a single document by ID
  // async get(id) {
  //   try {
  //     const docRef = doc(this.ref, id);
  //     const docSnap = await getDoc(docRef);
  //     if (docSnap.exists()) {
  //       return { id: docSnap.id, ...docSnap.data() };
  //     } else {
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error('Error getting document:', error);
  //     return null;
  //   }
  // }

  // // Get all documents in the collection, with optional filters
  // async getAll(filter = {}) {
  //   try {
  //     let q = this.ref;
  //     Object.keys(filter).forEach((key) => {
  //       q = query(q, where(key, '==', filter[key]));
  //     });

  //     const querySnapshot = await getDocs(q);
  //     const documents = [];
  //     querySnapshot.forEach((doc) => {
  //       documents.push({ id: doc.id, ...doc.data() });
  //     });
  //     return documents;
  //   } catch (error) {
  //     console.error('Error getting documents:', error);
  //     return [];
  //   }
  // }

  // // Add a new document to the collection
  // async add(item) {
  //   try {
  //     const docRef = await addDoc(this.ref, item);
  //     const newDoc = await getDoc(docRef);
  //     return { id: docRef.id, ...newDoc.data() };
  //   } catch (error) {
  //     console.error('Error adding document:', error);
  //     throw error;
  //   }
  // }

  // // Update an existing document by ID
  // async update(id, data) {
  //   try {
  //     const docRef = doc(this.ref, id);
  //     await updateDoc(docRef, data);
  //   } catch (error) {
  //     console.error('Error updating document:', error);
  //     throw error;
  //   }
  // }

  // // Delete a document by ID
  // async delete(id) {
  //   try {
  //     const docRef = doc(this.ref, id);
  //     await deleteDoc(docRef);
  //   } catch (error) {
  //     console.error('Error deleting document:', error);
  //     throw error;
  //   }
  // }

  // Subscribe to real-time updates for the collection
  subscribe(callback) {
    const unsubscribe = onSnapshot(this.ref, (snapshot) => {
      const documents = [];
      snapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      callback(documents);
    });

    // Return a function to unsubscribe from real-time updates
    return () => unsubscribe();
  }
}

export default FirebaseDataSource;
