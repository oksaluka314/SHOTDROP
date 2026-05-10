require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    await client.connect();
  } catch (error) {
    console.error("Помилка підключення до MongoDB:", error);
  }
}

connectDB();


app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    // Тут логіка збереження в MongoDB, яку ми обговорювали раніше
    // Наприклад: await User.create({ name, email, password });
    
    res.status(201).json({ message: "Користувача створено!" });
});