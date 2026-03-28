/**
 * Problem Routes
 *
 * This module handles all problem-related API endpoints including:
 * - Listing problems with pagination
 * - Getting problem details (different fields for admin vs public)
 * - Creating new problems (admin only)
 * - Updating existing problems (admin only)
 * - Deleting problems (admin only)
 */

import { prisma } from "@/packages/db";
import { requireAdmin } from "./auth";
import { success, failure } from "@/packages/utils/response";

/**
 * Request body type for creating a new problem
 * All fields are optional except title, slug, and statement
 */
type CreateProblemBody = {
  title?: string;
  slug?: string;
  difficulty?: string;
  statement?: string;
  editorial?: string;
  tags?: string[];
  timeLimitMs?: number;
  memoryLimitKb?: number;
  hasCustomChecker?: boolean;
  checkerCode?: string;
  isPublic?: boolean;
  testCases?: {
    input: string;
    expectedOutput: string;
    isSample?: boolean;
    points?: number;
  }[];
};

/**
 * Request body type for updating an existing problem
 * Includes optional id field for test cases to support updates
 */
type UpdateProblemBody = {
  title?: string;
  slug?: string;
  difficulty?: string;
  statement?: string;
  editorial?: string;
  tags?: string[];
  timeLimitMs?: number;
  memoryLimitKb?: number;
  hasCustomChecker?: boolean;
  checkerCode?: string;
  isPublic?: boolean;
  testCases?: {
    id?: string;
    input: string;
    expectedOutput: string;
    isSample?: boolean;
    points?: number;
  }[];
};

/**
 * Handles GET /api/problems
 *
 * Retrieves a paginated list of all problems.
 * Returns only public-facing fields (no editorial, checkerCode, etc.)
 *
 * @param req - The incoming HTTP request
 * @returns JSON response with problems array and pagination metadata
 */
export async function handleProblemsList(req: Request): Promise<Response> {
  // Parse pagination params from query string
  // Default: start=0, end=20 (first 20 problems)
  const url = new URL(req.url);
  const start = parseInt(url.searchParams.get("start") || "0");
  const end = parseInt(url.searchParams.get("end") || "20");
  const take = end - start;
  const skip = start;

  // Fetch problems ordered by creation date (newest first)
  // Only select fields that are safe to expose to public users
  const problems = await prisma.problem.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      difficulty: true,
      slug: true,
      tags: true,
      isPublic: true,
      createdAt: true,
      _count: {
        select: {
          testCases: true,
          submissions: true,
        },
      },
    },
  });

  return success("Problems retrieved", { problems });
}

/**
 * Handles GET /api/problems/:id
 *
 * Retrieves detailed information about a specific problem.
 * Admin users receive full problem data including editorial, checker code,
 * all test cases, and visibility settings.
 * Public users only receive sample test cases and basic problem info.
 *
 * @param req - The incoming HTTP request with params.id containing problem ID or slug
 * @returns JSON response with problem details (scope depends on user role)
 */
export async function handleProblemDetail(req: Request): Promise<Response> {
  // Extract problem ID/slug from route parameters
  const param = (req as any).params?.id;
  if (!param) return failure("Invalid problem id", null, 400);

  // Validate if param is a UUID (vs a slug string)
  // This determines which field to query with
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      param,
    );

  // Check if user is admin to determine which fields to return
  // Admin gets: editorial, checkerCode, all test cases, visibility settings
  // Public gets: only sample test cases, no sensitive data
  const authResult = await requireAdmin(req);
  const isAdmin = !(authResult instanceof Response);

  // Execute query with appropriate field selection based on admin status
  const problem = await prisma.problem.findUnique({
    where: isUuid ? { id: param } : { slug: param },
    select: isAdmin
      ? {
          // Admin sees ALL fields including sensitive data
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          statement: true,
          editorial: true,
          tags: true,
          timeLimitMs: true,
          memoryLimitKb: true,
          isPublic: true,
          hasCustomChecker: true,
          checkerCode: true,
          testCases: {
            select: {
              id: true,
              input: true,
              expectedOutput: true,
              isSample: true,
              points: true,
            },
          },
        }
      : {
          // Public users only see sample test cases
          // Sensitive fields (editorial, checkerCode, isPublic, etc.) are hidden
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          statement: true,
          tags: true,
          timeLimitMs: true,
          memoryLimitKb: true,
          testCases: {
            where: { isSample: true },
            select: {
              id: true,
              input: true,
              expectedOutput: true,
              isSample: true,
              points: true,
            },
          },
        },
  });

  // Handle case where problem doesn't exist
  if (!problem) {
    return failure("Problem not found", null, 404);
  }

  return success("Problem retrieved", problem);
}

/**
 * Handles POST /api/problem/create
 *
 * Creates a new problem with the provided data.
 * Requires admin authentication.
 *
 * @param req - The incoming HTTP request with problem data in JSON body
 * @returns JSON response with created problem (201 Created) or error
 */
export async function handleProblemCreate(req: Request): Promise<Response> {
  // Ensure only admins can create problems
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  // Parse request body
  const body = (await req.json()) as CreateProblemBody;

  // Extract fields with sensible defaults
  const {
    title,
    slug,
    difficulty = "MEDIUM",
    statement,
    editorial,
    tags = [],
    timeLimitMs = 2000,
    memoryLimitKb = 262144,
    hasCustomChecker = false,
    checkerCode,
    isPublic = false,
    testCases = [],
  } = body;

  // Validate required fields
  if (!title || !slug || !statement) {
    return failure("title, slug, and statement are required", null, 400);
  }

  // Check for duplicate slug (must be unique)
  const existing = await prisma.problem.findUnique({ where: { slug } });
  if (existing) {
    return failure("A problem with this slug already exists", null, 409);
  }

  // Create problem with associated test cases
  // Default difficulty is MEDIUM if not specified
  // Default time limit is 2000ms, memory is 256MB (262144 KB)
  // Problems are private by default (isPublic: false)
  const problem = await prisma.problem.create({
    data: {
      title,
      slug,
      difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      statement,
      editorial,
      tags,
      timeLimitMs,
      memoryLimitKb,
      hasCustomChecker,
      checkerCode,
      isPublic,
      testCases: {
        create: testCases.map(
          (tc: {
            input: string;
            expectedOutput: string;
            isSample?: boolean;
            points?: number;
          }) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: tc.isSample ?? false,
            points: tc.points ?? 0,
          }),
        ),
      },
    },
    include: { testCases: true },
  });

  return success("Problem created", { problem }, 201);
}

/**
 * Handles PUT /api/problems/:id
 *
 * Updates an existing problem with new data.
 * Requires admin authentication.
 * If test cases are provided in the request, they will replace all existing test cases.
 *
 * @param req - The incoming HTTP request with updated problem data in JSON body
 * @returns JSON response with updated problem or error
 */
export async function handleProblemUpdate(req: Request): Promise<Response> {
  // Ensure only admins can update problems
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  // Extract problem ID/slug from route parameters
  const param = (req as any).params?.id;
  if (!param) return failure("Invalid problem id", null, 400);

  // Validate if param is a UUID
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      param,
    );

  // Fetch existing problem to verify it exists
  const existing = await prisma.problem.findUnique({
    where: isUuid ? { id: param } : { slug: param },
  });

  if (!existing) {
    return failure("Problem not found", null, 404);
  }

  // Parse request body
  const body = (await req.json()) as UpdateProblemBody;

  // Destructure updateable fields
  const {
    title,
    slug,
    difficulty,
    statement,
    editorial,
    tags,
    timeLimitMs,
    memoryLimitKb,
    hasCustomChecker,
    checkerCode,
    isPublic,
    testCases,
  } = body;

  // Validate slug uniqueness if being changed
  // Check that new slug doesn't already belong to another problem
  if (slug && slug !== existing.slug) {
    const slugExists = await prisma.problem.findUnique({ where: { slug } });
    if (slugExists) {
      return failure("A problem with this slug already exists", null, 409);
    }
  }

  // Build update data object with only provided fields (partial update)
  // Using spread operator to conditionally include fields only when they exist
  const problem = await prisma.problem.update({
    where: { id: existing.id },
    data: {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(difficulty && {
        difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      }),
      ...(statement && { statement }),
      ...(editorial !== undefined && { editorial }),
      ...(tags && { tags }),
      ...(timeLimitMs !== undefined && { timeLimitMs }),
      ...(memoryLimitKb !== undefined && { memoryLimitKb }),
      ...(hasCustomChecker !== undefined && { hasCustomChecker }),
      ...(checkerCode !== undefined && { checkerCode }),
      ...(isPublic !== undefined && { isPublic }),
    },
    include: { testCases: true },
  });

  // Handle test case updates if provided
  // This replaces ALL existing test cases with the new ones
  if (testCases) {
    // First delete all existing test cases
    await prisma.testCase.deleteMany({
      where: { problemId: problem.id },
    });

    // Then create the new test cases
    await prisma.testCase.createMany({
      data: testCases.map((tc) => ({
        problemId: problem.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isSample: tc.isSample ?? false,
        points: tc.points ?? 0,
      })),
    });
  }

  // Fetch the fully updated problem with test cases to return
  const updatedProblem = await prisma.problem.findUnique({
    where: { id: problem.id },
    include: { testCases: true },
  });

  return success("Problem updated", { problem: updatedProblem });
}

/**
 * Handles DELETE /api/problems/:id
 *
 * Permanently deletes a problem and all associated data (test cases, submissions).
 * Requires admin authentication.
 *
 * @param req - The incoming HTTP request with problem ID/slug in params
 * @returns JSON response with deleted problem ID or error
 */
export async function handleProblemDelete(req: Request): Promise<Response> {
  // Ensure only admins can delete problems
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  // Extract problem ID/slug from route parameters
  const param = (req as any).params?.id;
  if (!param) return failure("Invalid problem id", null, 400);

  // Validate if param is a UUID
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      param,
    );

  // Fetch problem to verify it exists before deletion
  const problem = await prisma.problem.findUnique({
    where: isUuid ? { id: param } : { slug: param },
  });

  if (!problem) {
    return failure("Problem not found", null, 404);
  }

  // Perform the deletion
  // Note: Associated test cases and submissions will be cascade deleted
  // based on Prisma schema configuration
  await prisma.problem.delete({
    where: { id: problem.id },
  });

  return success("Problem deleted", { id: problem.id });
}
