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
		select: {
			id: true,
			title: true,
			difficulty: true,
			slug: true,
		},
		where: { isPublic: true },
		orderBy: { createdAt: 'desc' },
	});

	return new Response(JSON.stringify({ problems }), { status: 200, headers: { "Content-Type": "application/json" } });

}

export async function handleProblemDetail(req: Request): Promise<Response> {
	// Extract problem id from URL
	const id = (req as any).params?.id;
	if (!id) return new Response(JSON.stringify({ error: 'Invalid problem id' }), { status: 400 });

	const problem = await prisma.problem.findUnique({
		where: { id },
		include: {
			testCases: true,
		},
	});

	if (!problem || !problem.isPublic) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

	return new Response(JSON.stringify(problem), { status: 200, headers: { "Content-Type": "application/json" } });
}
