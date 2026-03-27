
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    abort: () => void,
): Promise<T> {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            abort();
            reject(new Error("TLE"));
        }, ms);
        promise
            .then((v) => {
                clearTimeout(id);
                resolve(v);
            })
            .catch((e) => {
                clearTimeout(id);
                reject(e);
            });
    });
}
