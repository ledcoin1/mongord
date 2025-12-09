const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb+srv://ashamosugan_db_user:p6iTqvB3zkyZcZmH@cluster0.wmdzsm8.mongodb.net/telegram_balance_app?retryWrites=true&w=majority&tls=true";

const client = new MongoClient(MONGO_URI);

let users;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("telegram_balance_app");
    users = db.collection("users");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoBD error:", err);
  }
}

connectDB();

// ✅ Ойыншы кіргенде
app.get('/get_balance', async (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) return res.json({ error: "No user_id" });

  let user = await users.findOne({ user_id });

  if (!user) {
    user = { user_id, balance: 0 };
    await users.insertOne(user);
  }

  res.json(user);
});

// ✅ Админ баланс өзгерту
app.get('/admin/set_balance', async (req, res) => {
  const { user_id, balance } = req.query;
  if (!user_id || !balance) {
    return res.json({ error: "user_id and balance required" });
  }

  await users.updateOne(
    { user_id },
    { $set: { balance: Number(balance) } },
    { upsert: true }
  );

  res.json({ ok: true });
});

// ✅ Барлық ойыншыларды көру
app.get('/admin/all_users', async (req, res) => {
  const all = await users.find().toArray();
  res.json(all);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
