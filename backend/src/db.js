import mongoose from 'mongoose';

const LEGACY_INDEXES = [
  { collection: 'customers', index: 'email_1' },
  { collection: 'segments',  index: 'name_1' },
  { collection: 'settings',  index: 'singleton_1' },
];

async function dropLegacyIndexes() {
  for (const { collection, index } of LEGACY_INDEXES) {
    try {
      const indexes = await mongoose.connection.collection(collection).indexes();
      if (indexes.some(i => i.name === index)) {
        await mongoose.connection.collection(collection).dropIndex(index);
        console.log(`Dropped legacy ${collection}.${index} index`);
      }
    } catch (e) {
      if (e.codeName !== 'NamespaceNotFound') {
        console.warn(`Index cleanup skipped for ${collection}.${index}:`, e.message);
      }
    }
  }
}

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/xenocrm';
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    await dropLegacyIndexes();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}
