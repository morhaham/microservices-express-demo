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

export const createConsumer = async (groupId: string) => {
    const consumer = kafka.consumer({ groupId });
    gracefulShutdown(() => consumerDisconnect(consumer))
    return consumer;
}


export const runConsumer = async (groupId: string, topic: string, fromBeginning: boolean, eachMessage: EachMessageHandler) => {
    const consumer = await createConsumer(groupId)
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning });
    await consumer.run({
        eachMessage,
    })
};

async function consumerDisconnect(consumer: Consumer) {
    await consumer.disconnect();
}

async function producerDisconnect(producer: Producer) {
    await producer.disconnect();
}




