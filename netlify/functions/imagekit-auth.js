import crypto from "node:crypto";

export const handler = async () => {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY ?? "";
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 2400;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + String(expire))
    .digest("hex");

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, expire, signature }),
  };
};
