import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a connection
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'libresign',
  // Simplified for testing
  synchronize: false,
  logging: true,
});

// Test connection
async function testConnection() {
  try {
    await dataSource.initialize();
    console.log('✅ Connection to database successful!');
    console.log('Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      database: process.env.DB_DATABASE,
    });
    
    // Test query
    const result = await dataSource.query('SELECT 1 as connected');
    console.log('Query result:', result);

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('Environment variables:', {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_USERNAME: process.env.DB_USERNAME,
      DB_DATABASE: process.env.DB_DATABASE,
    });
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Connection closed');
    }
  }
}

testConnection(); 