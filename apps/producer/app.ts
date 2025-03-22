import express from "express";
import { producerSend, runConsumer } from "kafka";

const app = express();
const port = 3000;
const topic = process.env.KAFKA_TOPIC || 'test-topic';

// print env variables
console.log("KAFKA_BROKERS: ", process.env.KAFKA_BROKERS);
console.log("KAFKA_TOPIC: ", process.env.KAFKA_TOPIC);
console.log("NODE_ENV: ", process.env.NODE_ENV);

// --- Routes ---
app.get('/', (_, res) => {
  res.send('Hello, Microservices!');
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/send-message', async (req, res) => {
    try {
        const message = req.query.message || 'Default message'; // Get message from query parameter
        const resp = await producerSend({
            topic,
            messages: [
                { value: message.toString() },
            ],
        });
        console.log("[producerSend] response: ", resp)
        res.send(`Message sent: ${message}`);
    } catch (error) {
        console.error("Failed to send message:", error);
        res.status(500).send("Failed to send message");
    }
});

app.listen(port, async () => {
  console.log(`Service running on port ${port}`);

  await runConsumer('test-group', 'test-topic', true, async (message) => {
    console.log("[runConsumer] message: ", message);
  });
});
