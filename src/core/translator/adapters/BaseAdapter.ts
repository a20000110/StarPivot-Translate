
import https from "https";
import { URL } from "url";
import { TranslationError, TranslationErrorCode } from "../errors";

export abstract class BaseAdapter {
    protected async post<T>(fullUrl: string, body: any, headers: Record<string, string> = {}): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let urlObj: URL;
            try {
                urlObj = new URL(fullUrl);
            } catch (e) {
                return reject(new TranslationError(`Invalid URL: ${fullUrl}`, TranslationErrorCode.VALIDATION_ERROR));
            }

            const payload = JSON.stringify(body);
            const requestOptions: https.RequestOptions = {
                method: "POST",
                hostname: urlObj.hostname,
                path: `${urlObj.pathname}${urlObj.search}`,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload),
                    ...headers
                }
            };

            const req = https.request(requestOptions, (res) => {
                const chunks: Buffer[] = [];
                res.on("data", (d) => chunks.push(d));
                res.on("end", () => {
                    const raw = Buffer.concat(chunks).toString("utf-8");
                    if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                        return reject(new TranslationError(
                            `HTTP Error ${res.statusCode}: ${raw}`,
                            TranslationErrorCode.NETWORK_ERROR
                        ));
                    }
                    try {
                        const json = JSON.parse(raw);
                        resolve(json);
                    } catch (e) {
                        reject(new TranslationError(
                            "Failed to parse response",
                            TranslationErrorCode.VENDOR_ERROR,
                            e
                        ));
                    }
                });
            });

            req.on("error", (err) => {
                reject(new TranslationError(
                    err.message,
                    TranslationErrorCode.NETWORK_ERROR,
                    err
                ));
            });

            req.on("timeout", () => {
                req.destroy();
                reject(new TranslationError(
                    "Request timeout",
                    TranslationErrorCode.NETWORK_TIMEOUT
                ));
            });

            req.write(payload);
            req.end();
        });
    }
}
