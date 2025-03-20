import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',  // Note: pg uses 'user' not 'username'
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'libresign',
});

async function testConnection() {
  try {
    console.log('Connecting with settings:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      database: process.env.DB_DATABASE,
    });
    
    await client.connect();
    console.log('✅ Connection successful!');
    
    const result = await client.query('SELECT 1 as connected');
    console.log('Query result:', result.rows);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await client.end();
  }
}

testConnection(); 