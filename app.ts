import express from "express";
import { Kafka, logLevel } from "kafkajs";

const app = express();
const port = 3000;

// --- Kafka Configuration ---
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.INFO, // Adjust as needed (ERROR, WARN, INFO, DEBUG)
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'my-group' });
const topic = process.env.KAFKA_TOPIC || 'test-topic';

// --- Connect and start consumer ---
const run = async () => {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                topic,
                partition,
                key: message.key?.toString(),
                value: message.value?.toString(),
                headers: message.headers,
            });
        },
    });
};

run().catch(console.error);

// --- Routes ---
app.get('/', (_, res) => {
  res.send('Hello, Microservices!');
});

app.get('/send-message', async (req, res) => {
    try {
        const message = req.query.message || 'Default message'; // Get message from query parameter
        await producer.send({
            topic,
            messages: [
                { value: message },
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

// --- Graceful shutdown ---
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

errorTypes.forEach(type => {
    process.on(type, async (e) => {
        try {
            console.log(`process.on ${type}`);
            console.error(e);
            await producer.disconnect();
            await consumer.disconnect();
            process.exit(0);
        } catch (_) {
            process.exit(1);
        }
    });
});

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            console.log(`process.on ${type}`);
            await producer.disconnect();
            await consumer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});

