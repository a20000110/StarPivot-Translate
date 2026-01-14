
import https from "https";
import { URL } from "url";
import { TranslationError, TranslationErrorCode } from "../errors";
import { AdapterConfig } from "../types";

export abstract class BaseAdapter {
    private static lastRequestTimes: Map<string, number> = new Map();

    constructor(protected config: AdapterConfig) {}

    protected async post<T>(fullUrl: string, body: any, headers: Record<string, string> = {}): Promise<T> {
        // Rate Limiting
        await this.checkRateLimit(fullUrl);

        // Retry Logic
        let lastError: Error | null = null;
        const maxRetries = this.config.maxRetries ?? 3;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    // Exponential backoff: 200ms, 400ms, 800ms...
                    const delay = 200 * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, delay));
                }
                return await this.doRequest<T>(fullUrl, body, headers);
            } catch (err: any) {
                lastError = err;
                // Only retry on network errors or 5xx
                if (err instanceof TranslationError) {
                    if (err.code === TranslationErrorCode.NETWORK_ERROR ||
                        err.code === TranslationErrorCode.NETWORK_TIMEOUT) {
                        continue;
                    }
                    // For HTTP status errors, check if 5xx
                    if (err.message.includes("HTTP Error 5")) {
                        continue;
                    }
                }
                throw err; // Non-retriable error
            }
        }
        throw lastError || new TranslationError("Request failed after retries", TranslationErrorCode.NETWORK_ERROR);
    }

    private async checkRateLimit(urlStr: string): Promise<void> {
        const qps = this.config.qps ?? 5; // Default 5 QPS for stability
        const interval = 1000 / qps;
        
        let hostname = "unknown";
        try {
            hostname = new URL(urlStr).hostname;
        } catch {
            // ignore
        }

        const now = Date.now();
        const lastTime = BaseAdapter.lastRequestTimes.get(hostname) || 0;
        const timeSinceLast = now - lastTime;

        if (timeSinceLast < interval) {
            const waitTime = interval - timeSinceLast;
            // Update the time to the future when this request "finishes" (starts)
            BaseAdapter.lastRequestTimes.set(hostname, now + waitTime);
            await new Promise(r => setTimeout(r, waitTime));
        } else {
            BaseAdapter.lastRequestTimes.set(hostname, now);
        }
    }

    private doRequest<T>(fullUrl: string, body: any, headers: Record<string, string>): Promise<T> {
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
                },
                timeout: this.config.timeout // Apply timeout from config if available
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
