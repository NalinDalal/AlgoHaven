export interface RouteParams {
  [key: string]: string;
}

export interface IdParams extends RouteParams {
  id: string;
}

export interface ContestProblemParams extends RouteParams {
  id: string;
  problemId: string;
}

export interface UsernameParams extends RouteParams {
  username: string;
}

export function getParams(req: Request): RouteParams {
  return (req as { params?: RouteParams }).params ?? {};
}

export function getIdParams(req: Request): IdParams {
  const params = getParams(req);
  return { id: params.id! };
}

export function getContestProblemParams(req: Request): ContestProblemParams {
  const params = getParams(req);
  return { id: params.id!, problemId: params.problemId! };
}

export function getUsernameParams(req: Request): UsernameParams {
  const params = getParams(req);
  return { username: params.username! };
}
