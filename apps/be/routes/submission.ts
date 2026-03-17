import { prisma } from '@/packages/db';
import { requireAuth } from './auth';

export async function handleSubmitSolution(req: Request): Promise<Response> {
  // Authenticate user
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  // Parse request body
  const url = new URL(req.url);
  const idMatch = url.pathname.match(/\/api\/problems\/(.+)\/submission/);
  const problemId = idMatch ? idMatch[1] : null;
  if (!problemId) return new Response(JSON.stringify(
    { error: 'Invalid problem id' }),
    { status: 400 }
  );
  const body = await req.json() as any;
  const code = body.code;
  const language = body.language;

  // Create submission
  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId,
      code,
      language,
      status: 'QUEUED',
    },
  });
  // Return submission id
  return new Response(JSON.stringify(
    { submission_id: submission.id, status: 'QUEUED' }
  ),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function handleSubmissionStatus(req: Request): Promise<Response> {
  // Extract submission id from URL
  const url = new URL(req.url);
  const idMatch = url.pathname.match(/\/api\/submissions\/(.+)\/status/);
  const submissionId = idMatch ? idMatch[1] : null;
  if (!submissionId) return new Response(JSON.stringify(
    { error: 'Invalid submission id' }
  ), { 
    status: 400 
  }
);
	const submission = await prisma.submission.findUnique({
		where: { id: submissionId },
		include: { problem: true },
	});
	if (!submission) return new Response(JSON.stringify(
		{ error: 'Not found' }
	), { status: 404 });
	return new Response(JSON.stringify({ 
		status: submission.status, 
		points: submission.points, 
		executionTimeMs: submission.executionTimeMs, 
		memoryUsedKb: submission.memoryUsedKb 
	}), { status: 200, headers: { "Content-Type": "application/json" } });
}

