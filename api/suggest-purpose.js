export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "活動名がありません",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    const prompt = `
あなたは児童発達支援・放課後等デイサービスの支援記録作成AIです。

活動名から、
活動目的キーワードを
4個だけ生成してください。

条件:
- 必ず日本語
- 1行のみ
- 「、」区切り
- 説明文禁止
- 句点禁止
- 箇条書き禁止
- 余計な文章禁止
- 20文字以内
- 出力はキーワードのみ

活動名:
${title}

出力例:
手先操作、集中力、工程理解、想像力
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "手先操作、集中力、活動参加";

    return res.status(200).json({
      purpose: text.trim(),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "生成失敗",
      purpose: "手先操作、集中力、活動参加",
    });
  }
}
