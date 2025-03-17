import express from "express";
import { producerSend } from "./kafka";

const app = express();
const port = 3000;
const topic = process.env.KAFKA_TOPIC || 'test-topic';

// --- Routes ---
app.get('/', (_, res) => {
  res.send('Hello, Microservices!');
});

app.get('/send-message', async (req, res) => {
    try {
        const message = req.query.message || 'Default message'; // Get message from query parameter
        await producerSend({
            topic,
            messages: [
                { value: message.toString() },
            ],
        });
        res.send(`Message sent: ${message}`);
    } catch (error) {
        console.error("Failed to send message:", error);
        res.status(500).send("Failed to send message");
    }
});

app.listen(port, () => {
  console.log(`Service running on port ${port}`);
});
