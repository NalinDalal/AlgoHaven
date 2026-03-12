import { prisma } from '@/packages/db';

export async function handleSubmitSolution(req: Request): Promise<Response> {
	// Parse request body
	const url = new URL(req.url);
	const idMatch = url.pathname.match(/\/api\/problems\/(.+)\/submission/);
	const challengeId = idMatch ? idMatch[1] : null;
	if (!challengeId) return new Response(JSON.stringify(
		{ error: 'Invalid problem id' }), 
		{ status: 400 }
	);
	const body = await req.json() as any;
	const user_id = body.user_id;
	const code = body.code;
	const language = body.language;
    
	// Create submission
	const submission = await prisma.submission.create({
		data: {
			userId: user_id,
			challengeId,
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
		include: { challenge: true },
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

