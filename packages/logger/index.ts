import pino from "pino";

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export type Logger = pino.Logger;

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

const baseOptions: pino.LoggerOptions = {
    name: "algohaven",
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
};

const devTransport: pino.LoggerOptions = isTest
    ? {}
    : {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
                customColors:
                    "err:red, warn:yellow, info:green, debug:blue, trace:gray",
            },
        },
    };

const logger = pino(
    isDev || isTest ? { ...baseOptions, ...devTransport } : baseOptions,
);

export function createLogger(service: string): Logger {
    return logger.child({ service });
}

export const db = createLogger("db");
export const redis = createLogger("redis");
export const auth = createLogger("auth");
export const worker = createLogger("worker");
export const be = createLogger("be");
export const ws = createLogger("ws");

export default logger;
