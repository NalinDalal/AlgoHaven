import { toBase64 } from "@algohaven/utils";
import { LANGUAGE_CONFIG, DOCKER_OPTIONS_NO_READONLY } from "./config";
import { worker } from "@algohaven/logger";

export interface ExecutionResult {
  status: string;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}

function buildDockerCommand(
  code: string,
  input: string,
  language: string,
): string[] {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const codeB64 = toBase64(code);
  const inputB64 = toBase64(input);

  if (language === "python") {
    const codeFilePath = `/tmp/submission.py`;
    return [
      "docker",
      "run",
      ...DOCKER_OPTIONS_NO_READONLY,
      "-i",
      config.image,
      "bash",
      "-c",
      `printf '%s' '${codeB64}' | base64 -d > ${codeFilePath} && printf '%s' '${inputB64}' | base64 -d | python3 ${codeFilePath}`,
    ];
  }

  if (language === "javascript") {
    const codeFilePath = `/tmp/submission.js`;
    return [
      "docker",
      "run",
      ...DOCKER_OPTIONS_NO_READONLY,
      "-i",
      config.image,
      "bash",
      "-c",
      `printf '%s' '${codeB64}' | base64 -d > ${codeFilePath} && printf '%s' '${inputB64}' | base64 -d | node ${codeFilePath}`,
    ];
  }

  if (language === "cpp") {
    const codeFilePath = `/tmp/submission.cpp`;
    const exeFilePath = `/tmp/submission`;
    return [
      "docker",
      "run",
      ...DOCKER_OPTIONS_NO_READONLY,
      "-i",
      config.image,
      "bash",
      "-c",
      `printf '%s' '${codeB64}' | base64 -d > ${codeFilePath} && g++ -o ${exeFilePath} ${codeFilePath} -std=c++17 && printf '%s' '${inputB64}' | base64 -d | ${exeFilePath}`,
    ];
  }

  if (language === "java") {
    const codeFilePath = `/tmp/Submission.java`;
    return [
      "docker",
      "run",
      ...DOCKER_OPTIONS_NO_READONLY,
      "-i",
      config.image,
      "bash",
      "-c",
      `printf '%s' '${codeB64}' | base64 -d > ${codeFilePath} && javac ${codeFilePath} && cd /tmp && printf '%s' '${inputB64}' | base64 -d | java Submission`,
    ];
  }

  if (language === "go") {
    const codeFilePath = `/tmp/submission.go`;
    return [
      "docker",
      "run",
      "--rm",
      "--network=none",
      "-e",
      "GOCACHE=/tmp/go-cache",
      "-e",
      "GOPATH=/tmp/go",
      "-i",
      "golang:1.21",
      "bash",
      "-c",
      `mkdir -p /tmp/go-cache /tmp/go && printf '%s' '${codeB64}' | base64 -d > ${codeFilePath} && printf '%s' '${inputB64}' | base64 -d | go run ${codeFilePath}`,
    ];
  }

  throw new Error(`Unsupported language: ${language}`);
}

export async function runCode(
  code: string,
  input: string,
  language: string,
): Promise<ExecutionResult> {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    worker.warn({ language }, "Unsupported language");
    return {
      status: "COMPILE_ERROR",
      stdout: "",
      stderr: `Unsupported language: ${language}`,
      executionTimeMs: 0,
    };
  }

  const startTime = Date.now();

  try {
    const cmd = buildDockerCommand(code, input, language);
    worker.debug({ language, inputLength: input.length, codeLength: code.length }, "Executing code in Docker");
    const proc = Bun.spawn(cmd);

    const exitCode = await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => {
        proc.kill();
        reject(new Error("TLE"));
      }, config.timeout * 1000);

      proc.exited.then((code) => {
        clearTimeout(timeout);
        resolve(code);
      });
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    const executionTimeMs = Date.now() - startTime;

    if (exitCode === 0) {
      worker.debug({ language, executionTimeMs }, "Code execution successful");
      return {
        status: "OK",
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        executionTimeMs,
      };
    } else {
      worker.warn({ language, exitCode, executionTimeMs }, "Code execution failed with non-zero exit");
      return {
        status: "RUNTIME_ERROR",
        stdout: stdout.trim(),
        stderr: stderr.trim() || "Runtime error",
        executionTimeMs,
      };
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Execution failed";
    const executionTimeMs = Date.now() - startTime;
    if (errMsg === "TLE") {
      worker.warn({ language, executionTimeMs }, "Code execution TLE");
      return {
        status: "TLE",
        stdout: "",
        stderr: "Time limit exceeded",
        executionTimeMs: config.timeout * 1000,
      };
    }
    worker.error({ language, error: errMsg, executionTimeMs }, "Code execution error");
    return {
      status: "RUNTIME_ERROR",
      stdout: "",
      stderr: errMsg,
      executionTimeMs,
    };
  }
}
