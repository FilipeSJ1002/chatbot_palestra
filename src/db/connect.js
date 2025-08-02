const mongoose = require('mongoose');

async function connectToDatabase() {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    throw new Error('❌ MONGO_URI não está definida no .env');
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Erro MongoDB:', error);
    process.exit(1);
  }
}

module.exports = connectToDatabase;
