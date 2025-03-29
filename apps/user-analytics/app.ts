import { runConsumer } from "kafka";

runConsumer('user-events-group', 'user-events-topic', true, async (message) => {
    console.log("[runConsumer] message: ", message);
  }).then(() => {
    console.log("[runConsumer] consumer started");
  }).catch((err) => {
    console.error("[runConsumer] error: ", err);
  });