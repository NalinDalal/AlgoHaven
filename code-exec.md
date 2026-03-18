## Code Execution Pipeline for User Submissions

When a user submits code to solve a problem, our platform follows a secure and efficient execution pipeline:

1. **Submission**:  
   The frontend sends the user's code, selected language, and problem ID to the backend via a POST request.

2. **Job Queuing**:  
   The backend enqueues the submission as a job, storing relevant metadata (user, problem, language, code) in a queue system (e.g., Redis, RabbitMQ).

3. **Isolated Execution**:  
   A worker service picks up the job and runs the code in a secure, sandboxed environment (such as Docker containers or Firecracker microVMs).  
   - The code is compiled (if needed) and executed for each test case.
   - Resource limits (CPU, memory, time) are strictly enforced to prevent abuse.

4. **Test Case Evaluation**:  
   The worker compares the program’s output against the expected output for each test case (including both sample and hidden cases).  
   - Results are collected for each test case (Accepted, Wrong Answer, Time Limit Exceeded, etc.).

5. **Result Reporting**:  
   The worker sends the verdicts and any relevant output (errors, logs) back to the backend, which stores the results and notifies the frontend.

6. **User Feedback**:  
   The frontend displays the results to the user in real time, including verdicts, execution time, memory usage, and error messages if any.

**Security & Performance**:  
- All code runs in isolated containers/VMs to prevent access to the host system.
- Resource limits and timeouts are enforced.
- The system is designed to scale horizontally by adding more worker nodes.

---

## Generic Multi-Language Code Execution Pipeline

Our code execution system is designed to be extensible and language-agnostic. Here’s how it works and how new languages can be added:

1. **Language Abstraction**
   - For each supported language (C++, Python, Go, TypeScript, etc.):
     - Provide a code template/boilerplate for new problems.
     - Define the commands to compile and/or run code (e.g., `g++` for C++, `go run` for Go).

2. **Adding a New Language (e.g., Go)**
   - Scaffold the starter code for the new language for all problems.
   - Store test cases in a language-agnostic format (input/output pairs).
   - Add a Docker image/container with the language’s compiler/interpreter.
   - Define how to inject user code and test cases into the container, compile (if needed), and execute.

3. **Execution Flow**
   - On user submission:
     - Detect the language.
     - Select the appropriate Docker image and command.
     - Mount/inject user code and test case files.
     - Run the compile and/or execute command inside the container.
     - Capture stdout/stderr and compare output to expected results.

4. **Extending to New Languages**
   - To add a new language:
     1. Add a code template for that language.
     2. Add a Docker image with the language’s compiler/interpreter.
     3. Update the backend to recognize the new language and use the correct image/commands.

**Example: Adding Go Support**
- Add a Go starter template for each problem.
- Add a Docker image with Go installed.
- On submission, if language is Go:
  - Write user code to `main.go`.
  - For each test case, run:
    `docker run --rm -v $CODE_DIR:/workspace go-image go run /workspace/main.go < /workspace/input.txt`
  - Capture and compare output.

This modular approach makes it easy to add support for any language in the future by simply providing a template and a Docker image with the right tools.

