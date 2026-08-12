# Database

Data layer of AlgoHaven: PostgreSQL via Prisma ORM, plus Redis for real-time features.

---

## Prisma Models

| Model              | Key Fields                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `User`             | `id`, `email`, `role` (USER/ADMIN), `username`                                           |
| `Session`          | `id`, `tokenHash`, `userId`, `expiresAt`                                                 |
| `Problem`          | `id`, `title`, `slug`, `difficulty`, `statement`, `tags`, `timeLimitMs`, `memoryLimitKb` |
| `TestCase`         | `id`, `problemId`, `input`, `expectedOutput`, `isSample`, `points`                       |
| `Contest`          | `id`, `title`, `slug`, `startTime`, `endTime`, `visibility`, `isRated`, `freezeTime`     |
| `ContestProblem`   | `id`, `contestId`, `problemId`, `index`, `points`                                        |
| `Submission`       | `id`, `userId`, `problemId`, `contestId`, `code`, `language`, `status`, `judgePhase`     |
| `LeaderboardEntry` | `id`, `contestId`, `userId`, `totalPoints`, `solved`, `penaltyMins`, `isFrozen`          |
| `LeaderboardSnapshot` | `id`, `contestId`, `userId`, `totalPoints`, `solved`, `penaltyMins`, `snapshotTime`  |
| `UserRating`       | `id`, `userId`, `contestId`, `ratingBefore`, `ratingAfter`, `rank`                       |
| `PlagiarismReport` | `id`, `submissionId`, `similarityScore`, `status`                                        |
| `RejudgeJob`       | `id`, `problemId`, `contestId`, `submissionId`, `status`                                 |

## Enums

- **Role**: `USER`, `ADMIN`
- **Difficulty**: `EASY`, `MEDIUM`, `HARD`
- **ContestVisibility**: `PUBLIC`, `INVITE`, `PRIVATE`
- **SubmissionStatus**: `QUEUED`, `RUNNING`, `ACCEPTED`, `WRONG_ANSWER`, `TLE`, `MLE`, `RUNTIME_ERROR`, `COMPILE_ERROR`
- **JudgePhase**: `PRACTICE`, `CONTEST_PHASE1`, `CONTEST_PHASE2`

---

## Test Case Storage

Test cases are stored as **relational rows** (NOT JSON):

```prisma
model TestCase {
  id             String  @id @default(uuid())
  problemId      String
  input          String
  expectedOutput String
  isSample       Boolean @default(false)
  points         Int     @default(0)
}
```

**Benefits:**

- Easy add/edit/delete of individual test cases
- Query hidden vs sample test cases via `isSample` field
- Index on `problemId` for fast lookups
- Per-test-case scoring (for partial credit)

See the full design rationale in [System Design](./design.md#test-case-database-storage-implemented).