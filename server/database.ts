import mongoose from 'mongoose';

let databaseConnectionPromise: Promise<typeof mongoose> | null = null;
let lastDatabaseError: string | null = null;

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDatabaseStatus() {
  return {
    connected: isDatabaseConnected(),
    lastError: lastDatabaseError,
  };
}

export function getDatabaseUnavailableMessage(): string {
  return 'Database is currently unavailable. MongoDB Atlas network access must allow this deployment before login or signup can work.';
}

export async function ensureDatabaseConnection() {
  if (isDatabaseConnected()) {
    return mongoose;
  }

  if (!databaseConnectionPromise) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portify';
    databaseConnectionPromise = mongoose.connect(mongoUri).then((connection) => {
      lastDatabaseError = null;
      return connection;
    }).catch((error: unknown) => {
      lastDatabaseError = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
      databaseConnectionPromise = null;
      throw error;
    });
  }

  return databaseConnectionPromise;
}
