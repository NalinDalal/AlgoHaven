import { prisma } from '@/packages/db';

export async function handleProblemsList(req: Request): Promise<Response> {
	// Parse pagination params
	const url = new URL(req.url);
	const start = parseInt(url.searchParams.get('start') || '0');
	const end = parseInt(url.searchParams.get('end') || '20');
	const take = end - start;
	const skip = start;
 
	const problems = await prisma.problem.findMany({
		skip,
		take,
		where: { isPublic: true },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			title: true,
			difficulty: true,
			slug: true,
			tags: true,
		},
	});
 
	return new Response(
		JSON.stringify({ problems }),
		{ status: 200, headers: { 'Content-Type': 'application/json' } }
	);
}

export async function handleProblemDetail(req: Request): Promise<Response> {
	// Extract problem id from URL
	const param = (req as any).params?.id;
	if (!param) return new Response(JSON.stringify({ error: 'Invalid problem id' }), { status: 400 });


	const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

	const problem = await prisma.problem.findUnique({
		where: isUuid ? { id: param } : { slug: param },
		select: {
			id: true,
			title: true,
			slug: true,
			difficulty: true,
			statement: true,
			tags: true,
			timeLimitMs: true,
			memoryLimitKb: true,
			// Only return sample test cases — hidden ones stay server-side
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
			// Intentionally excluded from response:
			// editorial    — only published after contest ends
			// checkerCode  — judge-side only, never sent to client
			// notionDocId  — internal migration field
			// isPublic     — internal flag, not needed by client
			// hasCustomChecker — internal judge config
		},
	});
 
	if (!problem) {
		return new Response(
			JSON.stringify({ error: 'Not found' }),
			{ status: 404 }
		);
	}
 
	return new Response(
		JSON.stringify(problem),
		{ status: 200, headers: { 'Content-Type': 'application/json' } }
	);
}
 