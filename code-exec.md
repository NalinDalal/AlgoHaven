# Code Execution Service

## Overview

Docker-based code execution sandbox for competitive programming. Each submission runs in an isolated container with strict resource limits.

---

## Architecture

```
User Submit → Backend API → Queue → Worker → Docker Container → Result
                                   ↓
                              PostgreSQL ← Results stored
```

---

## Docker Security Configuration

### Container Hardening

```dockerfile
# Security flags
docker run \
  --cpus="0.5" \
  --memory="512M" \
  --memory-swap="512M" \
  --pids-limit=50 \
  --cap-drop="ALL" \
  --network="none" \
  --read-only \
  --user=1000 \
  --security-opt="no-new-privileges" \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  code-runner
```

### Key Security Measures

| Flag                                 | Purpose                      |
| ------------------------------------ | ---------------------------- |
| `--cpus="0.5"`                       | Limit CPU to 0.5 cores       |
| `--memory="512M"`                    | Limit RAM to 512MB           |
| `--network="none"`                   | No network access            |
| `--read-only`                        | Read-only filesystem         |
| `--user=1000`                        | Run as non-root              |
| `--cap-drop="ALL"`                   | Drop all capabilities        |
| `--security-opt="no-new-privileges"` | Prevent privilege escalation |
| `--pids-limit=50`                    | Limit process count          |

---

## Supported Languages

| Language   | Compiler/Interpreter | Docker Image         | Time Multiplier |
| ---------- | -------------------- | -------------------- | --------------- |
| Python     | Python 3.11          | `python:3.11-slim`   | 3x              |
| C++        | GCC 13               | `gcc:13`             | 1x              |
| Java       | OpenJDK 21           | `openjdk:21-slim`    | 2x              |
| JavaScript | Node 20              | `node:20-slim`       | 2x              |
| Go         | Go 1.21              | `golang:1.21-alpine` | 2x              |

---

## Execution Flow

### 1. Submission Entry

```typescript
POST /api/problems/:id/submission
{
  code: string,
  language: "python" | "cpp" | "java" | "javascript" | "go"
}
```

### 2. Worker Processing

```
1. Pull Docker image (cached)
2. Write user code to temp file
3. Write test case input to temp file
4. Run container with timeout
5. Capture stdout/stderr
6. Compare output to expected
7. Record verdict per test case
8. Destroy container
```

### 3. Multi-Stage Build (C++ Example)

```dockerfile
# Build stage - compile code
FROM gcc:13 AS builder
WORKDIR /build
COPY code.cpp .
RUN g++ -o solution -O2 -pipe -static code.cpp

# Runner stage - minimal image
FROM ubuntu:22.04
COPY --from=builder /build/solution /app/solution
USER 1000
CMD ["/app/solution"]
```

### 4. Execution Command

```bash
# Python
docker run --rm \
  --network none \
  --memory=256m \
  --cpus=0.25 \
  --user 1000 \
  -v /tmp/input.txt:/input.txt:ro \
  python:3.11-slim \
  python /code/main.py < /input.txt

# C++ (pre-compiled)
docker run --rm \
  --network none \
  --memory=256m \
  --cpus=0.5 \
  --user 1000 \
  -v /tmp/input.txt:/input.txt:ro \
  compiled-runner
```

---

## Test Case Format

Test cases stored in PostgreSQL as relational rows:

```sql
-- Sample test case (shown to users)
INSERT INTO "TestCase" (id, "problemId", input, "expectedOutput", "isSample")
VALUES (gen_random_uuid(), :problemId, '1 2', '3', true);

-- Hidden test case (judging only)
INSERT INTO "TestCase" (id, "problemId", input, "expectedOutput", "isSample")
VALUES (gen_random_uuid(), :problemId, '10 20', '30', false);
```

---

## Verdict Types

| Status          | Description              |
| --------------- | ------------------------ |
| `ACCEPTED`      | All test cases passed    |
| `WRONG_ANSWER`  | Output mismatch          |
| `TLE`           | Time limit exceeded      |
| `MLE`           | Memory limit exceeded    |
| `RUNTIME_ERROR` | Crashed during execution |
| `COMPILE_ERROR` | Compilation failed       |

---

## Queue System

### Simple Queue (In-Memory for MVP)

```typescript
const queue: SubmissionJob[] = [];

async function enqueueSubmission(job: SubmissionJob) {
  queue.push(job);
  processNext();
}

async function processNext() {
  if (queue.length === 0) return;
  const job = queue.shift();
  await processSubmission(job);
}
```

### Production Queue (Redis Bull)

```typescript
import Queue from "bull";
const submissionQueue = new Queue("submissions", "redis://localhost:6379");

await submissionQueue.add({
  submissionId: submission.id,
  problemId: submission.problemId,
  code: submission.code,
  language: submission.language,
  testCases: testCases,
});
```

---

## Scaling

### Pre-Contest Warmup

```bash
# Pre-pull images before contest
docker pull python:3.11-slim
docker pull gcc:13
docker pull openjdk:21-slim
docker pull node:20-slim

# Pre-warm containers
for i in {1..10}; do
  docker create --name warmup-$i python:3.11-slim sleep 1
done
```

### Horizontal Scaling

- Add more worker nodes
- Use Kubernetes/Docker Swarm
- Auto-scale based on queue depth

---

## Implementation Checklist

- [ ] Docker setup on server
- [ ] Worker service with queue
- [ ] Language images (Python, C++, Java, JS, Go)
- [ ] Time/memory limits per language
- [ ] Compile step for C++, Java, Go
- [ ] Output comparison
- [ ] Verdict recording
- [ ] Frontend result display
- [ ] Queue monitoring

---

built a code execution service with:

1. Worker service (apps/worker/index.ts) - runs on port 3002
2. Docker sandbox - executes user code in isolated containers with:
   - CPU/memory limits
   - Network disabled
   - Non-root user (uid 1000)
   - Various security options
3. Backend integration:
   - Added /api/worker/update-submission endpoint
   - Worker updates submission status in DB after judging
   - Env vars: WORKER_SECRET, BACKEND_URL, WORKER_URL
4. Languages supported:
   - Python (python:3.11-slim)
   - JavaScript (node:20-slim)
5. Fixed shell escaping issue - Used base64 encoding + printf to write code files inside containers
   The full submission flow now works:
   User submits code → Backend creates submission → Sends to worker → Worker runs Docker → Updates status in DB → User polls status
