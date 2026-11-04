// GET simples via node:http(s). Não usamos fetch() porque o fetch do Node bloqueia
// as "bad ports" do padrão WHATWG (ex.: 4190, 6000, 6665-6669), que o Chrome aceita.
import http from "node:http";
import https from "node:https";

export function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(httpGet(new URL(res.headers.location, url).href));
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, ok: res.statusCode < 400, text: async () => body, json: async () => JSON.parse(body) }));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("timeout")));
  });
}
