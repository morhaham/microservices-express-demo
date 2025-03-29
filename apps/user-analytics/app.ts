import express from "express";
import { runConsumer } from "kafka";

const app = express();
const port = 3000;

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Service running on port ${port}`);
});

// Start the Kafka consumer
console.log("Starting Kafka consumer...");
runConsumer('user-events-group', 'user-events-topic', true, async (message) => {
  try {
    console.log("[runConsumer] Received message: ", {
      topic: message.topic,
      partition: message.partition,
      offset: message.message.offset,
      value: message.message.value?.toString() || '<no value>',
      timestamp: message.message.timestamp
    });
  } catch (error) {
    console.error("[runConsumer] Error processing message: ", error);
  }
}).then(() => {
  console.log("[runConsumer] Consumer started successfully");
}).catch((err) => {
  console.error("[runConsumer] Failed to start consumer: ", err);
  // Don't exit the process, just log the error
});