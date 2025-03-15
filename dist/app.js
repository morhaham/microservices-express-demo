"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const kafkajs_1 = require("kafkajs");
const app = (0, express_1.default)();
const port = 3000;
// --- Kafka Configuration ---
const kafka = new kafkajs_1.Kafka({
    clientId: 'my-app',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    logLevel: kafkajs_1.logLevel.INFO, // Adjust as needed (ERROR, WARN, INFO, DEBUG)
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'my-group' });
const topic = process.env.KAFKA_TOPIC || 'test-topic';
// --- Connect and start consumer ---
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield producer.connect();
    yield consumer.connect();
    yield consumer.subscribe({ topic, fromBeginning: true });
    yield consumer.run({
        eachMessage: (_a) => __awaiter(void 0, [_a], void 0, function* ({ topic, partition, message }) {
            var _b, _c;
            console.log({
                topic,
                partition,
                key: (_b = message.key) === null || _b === void 0 ? void 0 : _b.toString(),
                value: (_c = message.value) === null || _c === void 0 ? void 0 : _c.toString(),
                headers: message.headers,
            });
        }),
    });
});
run().catch(console.error);
// --- Routes ---
app.get('/', (_, res) => {
    res.send('Hello, Microservices!');
});
app.get('/send-message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = req.query.message || 'Default message'; // Get message from query parameter
        yield producer.send({
            topic,
            messages: [
                { value: message },
            ],
        });
        res.send(`Message sent: ${message}`);
    }
    catch (error) {
        console.error("Failed to send message:", error);
        res.status(500).send("Failed to send message");
    }
}));
app.listen(port, () => {
    console.log(`Service running on port ${port}`);
});
// --- Graceful shutdown ---
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
errorTypes.forEach(type => {
    process.on(type, (e) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log(`process.on ${type}`);
            console.error(e);
            yield producer.disconnect();
            yield consumer.disconnect();
            process.exit(0);
        }
        catch (_) {
            process.exit(1);
        }
    }));
});
signalTraps.forEach(type => {
    process.once(type, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log(`process.on ${type}`);
            yield producer.disconnect();
            yield consumer.disconnect();
        }
        finally {
            process.kill(process.pid, type);
        }
    }));
});
