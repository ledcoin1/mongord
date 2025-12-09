const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// Render Environment Variable-де қою керек: MONGO_URI
const client = new MongoClient(process.env.MONGO_URI);
let balancesCollection;

// MongoDB-ге қосылу
async function connectDB() {
  await client.connect();
  const db = client.db('telegram_balance_app');
  balancesCollection = db.collection('balances');
  console.log('MongoDB connected');
}

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Телеграм ойыншы балансы алу
app.get('/get_balance', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'user_id керек' });

  let user = await balancesCollection.findOne({ user_id: userId });
  if (!user) {
    // Жаңа ойыншы
    user = { user_id: userId, balance: 0 };
    await balancesCollection.insertOne(user);
  }
  res.json({ balance: user.balance });
});

// Балансты жаңарту (игрок өзі емес, админ қолданады)
app.post('/update_balance', async (req, res) => {
  const { user_id, balance } = req.body;
  if (!user_id || typeof balance !== 'number') {
    return res.status(400).json({ error: 'Дұрыс дерек жоқ' });
  }

  const result = await balancesCollection.updateOne(
    { user_id },
    { $set: { balance } },
    { upsert: true }
  );

  res.json({ success: true, balance });
});

// Барлық ойыншылар және баланс (админ үшін)
app.get('/admin/balances', async (req, res) => {
  const users = await balancesCollection.find({}).toArray();
  res.json(users);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
