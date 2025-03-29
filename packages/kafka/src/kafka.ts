import {  Kafka, logLevel, EachMessageHandler } from "kafkajs";
import { gracefulShutdown } from "./utils";

export interface ProducerRecord {
    topic: string
    messages: {key?: string, value: string}[]
}

export interface RecordMetadata{
    topicName: string
    partition: number
    errorCode: number
}

export interface Producer {
    connect: () => Promise<void>
    disconnect: () => Promise<void>
    send: (record: ProducerRecord) => Promise<RecordMetadata[]>
}

export interface Consumer {
    disconnect: Function
}

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    logLevel: logLevel.INFO,
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

let producer: Producer;

async function connect(): Promise<Producer> {
    if (!producer) {
        producer = kafka.producer();
        await producer.connect();
    }
    gracefulShutdown(() => producerDisconnect(producer))
    return producer;
}

export async function producerSend(record: ProducerRecord): Promise<Partial<RecordMetadata[]>> {
    const producer = await connect();
    return producer.send(record)
}

const createConsumer = async (groupId: string) => {
    console.log("[createConsumer] Creating consumer with groupId:", groupId);
    console.log("[createConsumer] Using brokers:", process.env.KAFKA_BROKERS);
    
    const consumer = kafka.consumer({ 
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 5000,
        retry: {
            initialRetryTime: 100,
            retries: 8
        }
    });
    
    gracefulShutdown(() => consumerDisconnect(consumer))
    return consumer;
}

export const runConsumer = async (groupId: string, topic: string, fromBeginning: boolean, eachMessage: EachMessageHandler) => {
    console.log("[runConsumer] Starting consumer for groupId:", groupId, "and topic:", topic);
    try {
        const consumer = await createConsumer(groupId);
        console.log("[runConsumer] Consumer created, connecting...");
        
        await consumer.connect();
        console.log("[runConsumer] Consumer connected, subscribing to topic...");
        
        await consumer.subscribe({ topic, fromBeginning });
        console.log("[runConsumer] Subscribed to topic:", topic);
        
        await consumer.run({
            eachMessage: async (...args) => {
                try {
                    await eachMessage(...args);
                } catch (error) {
                    console.error("[runConsumer] Error processing message:", error);
                }
            },
        });
        
        console.log("[runConsumer] Consumer is now running");
    } catch (error) {
        console.error("[runConsumer] Failed to start consumer:", error);
        throw error; // Re-throw to let the application handle it
    }
};

async function consumerDisconnect(consumer: Consumer) {
    try {
        await consumer.disconnect();
        console.log("[consumerDisconnect] Consumer disconnected successfully");
    } catch (error) {
        console.error("[consumerDisconnect] Error disconnecting consumer:", error);
    }
}

async function producerDisconnect(producer: Producer) {
    try {
        await producer.disconnect();
        console.log("[producerDisconnect] Producer disconnected successfully");
    } catch (error) {
        console.error("[producerDisconnect] Error disconnecting producer:", error);
    }
}




