export default function handler(req, res) {
  res.status(200).json({
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    keyStartsWith: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.slice(0, 3) : null
  });
}
