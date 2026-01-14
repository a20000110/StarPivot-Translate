import https from "https";
import { URL } from "url";

export interface TranslateRequest {
  translate_language: string;
  text: string[];
  from: string;
}

export interface TranslateResponse {
  data: string[];
  code: number;
  msg: string;
}

export const postTranslate = (apiUrl: string, body: TranslateRequest): Promise<TranslateResponse> => {
  const url = new URL(apiUrl);
  const payload = JSON.stringify(body);
  const options: https.RequestOptions = {
    method: "POST",
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  };
  return new Promise<TranslateResponse>((resolve, reject): void => {
    const req = https.request(options, (res): void => {
      const chunks: Buffer[] = [];
      res.on("data", (d): void => {
        chunks.push(d as Buffer);
      });
      res.on("end", (): void => {
        const raw = Buffer.concat(chunks).toString("utf-8");
        try {
          const json = JSON.parse(raw) as TranslateResponse;
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", (err): void => {
      reject(err);
    });
    req.write(payload);
    req.end();
  });
};
