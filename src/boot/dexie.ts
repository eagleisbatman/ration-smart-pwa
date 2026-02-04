import { boot } from 'quasar/wrappers';
import { db } from 'src/lib/offline/db';

export default boot(async () => {
  try {
    // Open the database
    await db.open();
    console.log('Dexie database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Dexie database:', error);
  }
});

export { db };
