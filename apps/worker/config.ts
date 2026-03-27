export const LANGUAGE_CONFIG: Record<
    string,
    { image: string; timeout: number }
> = {
    python: { image: "python:3.11-slim", timeout: 5 },
    javascript: { image: "node:20-slim", timeout: 5 },
    cpp: { image: "gcc:13.2.0", timeout: 10 },
    java: { image: "eclipse-temurin:21-jdk", timeout: 15 },
    go: { image: "golang:1.21", timeout: 10 },
};

export const DOCKER_OPTIONS = [
    "--rm",
    "--cpus=0.5",
    "--memory=256m",
    "--network=none",
    "--user=1000",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--pids-limit=50",
    "--read-only",
    "--tmpfs=/tmp:size=64m",
];

export const DOCKER_OPTIONS_NO_READONLY = [
    "--rm",
    "--cpus=0.5",
    "--memory=256m",
    "--network=none",
    "--user=1000",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--pids-limit=50",
];

export const MAX_CODE_SIZE = 50 * 1024;
export const MAX_INPUT_SIZE = 10 * 1024;
export const MAX_OUTPUT_SIZE = 100 * 1024;
