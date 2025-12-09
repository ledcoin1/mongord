const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB URI (Render Environment Variables-де MONGO_URI деп қос)
const client = new MongoClient(process.env.MONGO_URI || 'mongodb+srv://ashamosugan_db_user:p6iTqvB3zkyZcZmH@cluster0.wmdzsm8.mongodb.net/telegram_balance_app?retryWrites=true&w=majority&tls=false');

let users;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('telegram_balance_app');
    users = db.collection('users');
    console.log('MongoDB connected, users collection ready');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

// Кірген ойыншының балансы
app.get('/get_balance', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  try {
    let user = await users.findOne({ user_id });
    if (!user) {
      // Егер жаңа ойыншы болса, қосып қоямыз
      await users.insertOne({ user_id, balance: 0 });
      user = { user_id, balance: 0 };
    }
    res.json({ user_id: user.user_id, balance: user.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Админ эндпоинт: балансты өзгерту
app.post('/set_balance', async (req, res) => {
  const { user_id, balance } = req.body;
  if (!user_id || balance === undefined) return res.status(400).json({ error: 'user_id and balance required' });

  try {
    const result = await users.updateOne(
      { user_id },
      { $set: { balance: Number(balance) } },
      { upsert: true }
    );
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
