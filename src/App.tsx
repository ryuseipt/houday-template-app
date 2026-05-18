// @ts-nocheck
import { useState, useEffect } from "react";

const DEFAULT_HOUDAY_TEMPLATE = `スタッフの送迎にて来所する。
・学習（）
・脳バランサーキッズ２
活動では「」を行いました。〇〇を目的としております。〇〇さんは〇〇することができました。
活動終了時に今日のお約束を再確認して、振り返りを行ってからスタッフの送迎にて帰宅しています。`;

const DEFAULT_JIHATSU_TEMPLATE = `保育者の送迎にて登園しています。
登園後は、手洗いを済ませています。（排泄　有・無）
水分摂取は登園時・体操前・帰園前などに〇回以上飲んでおります。
自由時間の間で個別に脳バランサーキッズ２に取り組みました。

朝の会では、「」の絵本を読み、日付の確認とお返事を行いました。
体操は、「」の音楽に合わせて、リズムに乗りながら体を動かすことができています。
活動前には、〇〇を行っています。〇〇することができています。
活動では「」を行いました。〇〇を目的としております。
今日は〇〇を行っております。〇〇さんは、〇〇することができていました。
帰りの挨拶を済ませて、保育者の送迎にて帰園しています。`;

export default function App() {
  const [recordType, setRecordType] = useState("houday");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [support, setSupport] = useState(DEFAULT_HOUDAY_TEMPLATE);
  const [isGeneratingPurpose, setIsGeneratingPurpose] = useState(false);

  const createDefaultSupport = (
    activityTitle = "",
    type = recordType
  ) => {
    const template =
      type === "jihatsu"
        ? DEFAULT_JIHATSU_TEMPLATE
        : DEFAULT_HOUDAY_TEMPLATE;

    return template.replace(
      /活動では「.*?」/,
      `活動では「${activityTitle}」`
    );
  };

  useEffect(() => {
    setSupport(createDefaultSupport("", recordType));
  }, []);

  const handleTypeChange = (type) => {
    setRecordType(type);
    setSupport(createDefaultSupport(title, type));
  };

  const handleTitleChange = (value) => {
    setTitle(value);

    setSupport((prev) => {
      if (prev.trim() === "") {
        return createDefaultSupport(value, recordType);
      }

      return prev.replace(
        /活動では「.*?」/,
        `活動では「${value}」`
      );
    });
  };

  const generatePurpose = async () => {
    if (!title.trim()) {
      alert("先に活動名を入力してください");
      return;
    }

    try {
      setIsGeneratingPurpose(true);

      const response = await fetch("/api/suggest-purpose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (data?.purpose) {
        setPurpose(data.purpose);
      }
    } catch (error) {
      console.error(error);
      alert("AI生成に失敗しました");
    } finally {
      setIsGeneratingPurpose(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: "#f1f5f9",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <h1 style={{ textAlign: "center" }}>
          活動記録テンプレート
        </h1>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>放デイ</span>

            <button
              onClick={() =>
                handleTypeChange(
                  recordType === "houday"
                    ? "jihatsu"
                    : "houday"
                )
              }
              style={{
                width: 60,
                height: 30,
                borderRadius: 999,
                border: "none",
                background:
                  recordType === "jihatsu"
                    ? "#2563eb"
                    : "#111827",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: 3,
                  left:
                    recordType === "jihatsu"
                      ? 33
                      : 3,
                  transition: "0.2s",
                }}
              />
            </button>

            <span>児童発達支援</span>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) =>
            handleTitleChange(e.target.value)
          }
          placeholder="活動名"
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #cbd5e1",
          }}
        />

        <button
          onClick={generatePurpose}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "white",
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          {isGeneratingPurpose
            ? "AI生成中..."
            : "AIで目的を生成"}
        </button>

        <textarea
          value={purpose}
          onChange={(e) =>
            setPurpose(e.target.value)
          }
          placeholder="活動の目的"
          rows={5}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            boxSizing: "border-box",
          }}
        />

        <textarea
          value={support}
          onChange={(e) => {
            const value = e.target.value;

            if (value.trim() === "") {
              setSupport(
                createDefaultSupport(
                  title,
                  recordType
                )
              );
            } else {
              setSupport(value);
            }
          }}
          placeholder="支援内容"
          rows={14}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
