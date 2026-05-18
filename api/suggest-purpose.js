export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST only",
    });
  }

  try {
    const { title, templates = [] } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "活動名がありません",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    const exampleText = templates
      .slice(0, 8)
      .map((t) => {
        return `活動名: ${t.title}
目的: ${t.purpose}`;
      })
      .join("\n\n");

    const prompt = `
あなたは、
児童発達支援・放課後等デイサービスで働く
理学療法士視点の支援記録AIです。

活動名から、
療育・発達支援の観点を含めた
活動目的キーワードを
4〜6個生成してください。

重視する観点:
- 手先操作
- 協調運動
- 感覚統合
- 身体操作
- 姿勢保持
- 集中力
- コミュニケーション
- 活動参加
- 集団参加
- ルール理解
- 感情理解
- 空間認知
- 想像力
- 工程理解
- 自己表現

条件:
- 必ず日本語
- 1行のみ
- 「、」区切り
- 説明文禁止
- 短く自然
- 支援記録で実際に使う言葉
- 専門用語だけになりすぎない

過去の参考例:
${exampleText}

今回の活動名:
${title}

出力例:
手先操作、集中力、協調運動、活動参加、コミュニケーション
`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
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

    console.log(JSON.stringify(data));

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI_ERROR";

    return res.status(200).json({
      purpose: text.trim(),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "生成失敗",
      purpose: "AI_ERROR",
    });
  }
}
