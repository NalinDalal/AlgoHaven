
// -----------------------------------------------------------------------------
// Route pattern matcher
// Example:
// pattern: /api/problems/:id
// path:    /api/problems/abc123
// result:  { id: "abc123" }
// -----------------------------------------------------------------------------

export function matchRoute(
    pattern: string,
    pathname: string,
): Record<string, string> | null {
    const patternParts = pattern.split("/");
    const pathParts = pathname.split("/");
    if (patternParts.length !== pathParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];
        if (patternPart === undefined || pathPart === undefined) return null;
        // dynamic param (:id)
        if (patternPart.startsWith(":")) {
            params[patternPart.slice(1)] = pathPart;
        }
        // static segment mismatch
        else if (patternPart !== pathPart) {
            return null;
        }
    }
    return params;
}
