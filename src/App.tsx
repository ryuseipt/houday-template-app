// @ts-nocheck
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const purposeSuggestions = {
    新聞紙: "手先操作, 感覚刺激, 協調運動, 集中力",
    ボール: "協調運動, 空間認知, 距離感, 粗大運動",
    感覚遊び: "感覚刺激, 手先操作, 集中力, 触覚刺激",
    工作: "手先操作, 想像力, 集中力, 工程理解",
    SST: "コミュニケーション, 対人関係, 感情理解, 距離感",
    ダンス: "リズム感, 協調運動, 表現力, 模倣",
    縄跳び: "バランス感覚, 持久力, リズム感, 粗大運動",
    カード: "記憶力, ルール理解, 集中力, 順番理解",
    ブロック: "空間認知, 創造力, 手先操作, 集中力",
    お絵描き: "表現力, 想像力, 手先操作, 色彩感覚",
    粘土: "触覚刺激, 手先操作, 創造力, 集中力",
    パズル: "空間認知, 問題解決, 集中力, 思考力",
    風船: "協調運動, 距離感, 反射, 空間認知",
    サーキット: "粗大運動, バランス感覚, 身体操作, 持久力",
    体操: "柔軟性, 身体操作, バランス感覚, 模倣",
    読み聞かせ: "聞く力, 想像力, 集中力, 言語理解",
    クイズ: "記憶力, 思考力, 発言力, コミュニケーション",
    折り紙: "手先操作, 集中力, 工程理解, 想像力",
  };

  const createHoudaySupport = (activityTitle = "") => {
    return `スタッフの送迎にて来所する。
・学習（）
・脳バランサーキッズ２
活動では「${activityTitle}」を行いました。〇〇を目的としております。〇〇さんは〇〇することができました。
活動終了時に今日のお約束を再確認して、振り返りを行ってからスタッフの送迎にて帰宅しています。`;
  };

  const createJihatsuSupport = (activityTitle = "") => {
    return `保育者の送迎にて登園しています。
登園後は、手洗いを済ませています。（排泄　有・無）
水分摂取は登園時・体操前・帰園前などに〇回以上飲んでおります。
自由時間の間で個別に脳バランサーキッズ２に取り組みました。

朝の会では、「」の絵本を読み、日付の確認とお返事を行いました。
体操は、「」の音楽に合わせて、リズムに乗りながら体を動かすことができています。
活動前には、〇〇を行っています。〇〇することができています。
活動では「${activityTitle}」を行いました。〇〇を目的としております。
今日は〇〇を行っております。〇〇さんは、〇〇することができていました。
帰りの挨拶を済ませて、保育者の送迎にて帰園しています。`;
  };

  const createDefaultSupport = (activityTitle = "", type = recordType) => {
    return type === "jihatsu"
      ? createJihatsuSupport(activityTitle)
      : createHoudaySupport(activityTitle);
  };

  const [recordType, setRecordType] = useState("houday");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [support, setSupport] = useState(createHoudaySupport(""));
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 800);
    };

    window.addEventListener("resize", checkSize);

    return () => {
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  const loadTemplates = async () => {
    const snapshot = await getDocs(collection(db, "templates"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const sortedData = data.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    setTemplates(sortedData);
  };

  useEffect(() => {
    loadTemplates();
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

      return prev.replace(/活動では「.*?」/, `活動では「${value}」`);
    });

    const matchedKeyword = Object.keys(purposeSuggestions).find((keyword) =>
      value.includes(keyword)
    );

    if (matchedKeyword) {
      setPurpose(purposeSuggestions[matchedKeyword]);
    }
  };

  const saveTemplate = async () => {
    if (!title) {
      alert("活動名を入力してください");
      return;
    }

    if (editingId) {
      await updateDoc(doc(db, "templates", editingId), {
        recordType,
        title,
        purpose,
        support,
      });

      alert("更新しました");
    } else {
      await addDoc(collection(db, "templates"), {
        recordType,
        title,
        purpose,
        support,
        createdAt: new Date(),
      });

      alert("保存しました");
    }

    await loadTemplates();

    setTitle("");
    setPurpose("");
    setSupport(createDefaultSupport("", recordType));
    setEditingId(null);
  };

  const editTemplate = (template) => {
    const type = template.recordType || "houday";

    setEditingId(template.id);
    setRecordType(type);
    setTitle(template.title);
    setPurpose(template.purpose);
    setSupport(template.support);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteTemplate = async (id) => {
    await deleteDoc(doc(db, "templates", id));
    await loadTemplates();
    alert("削除しました");
  };

  const copyTemplate = async (template) => {
    const label =
      template.recordType === "jihatsu" ? "児童発達支援" : "放デイ";

    const text = `【種別】
${label}

【活動名】
${template.title}

【活動の目的】
${template.purpose}

【支援内容】
${template.support}`;

    await navigator.clipboard.writeText(text);

    setCopiedId(template.id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const filteredTemplates = templates.filter((template) => {
    const keyword = search.toLowerCase();

    const typeLabel =
      template.recordType === "jihatsu" ? "児童発達支援 児発" : "放デイ";

    const text = `${typeLabel} ${template.title} ${template.purpose} ${template.support}`.toLowerCase();

    return text.includes(keyword);
  });

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", fontSize: isMobile ? 28 : 36 }}>
          活動記録テンプレート
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div style={cardStyle}>
            <h2>{editingId ? "テンプレート編集中" : "新規テンプレート"}</h2>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: "bold", marginBottom: 8 }}>記録タイプ</p>

              <div style={switchWrapStyle}>
                <span
                  style={{
                    fontWeight: recordType === "houday" ? "bold" : "normal",
                    color: recordType === "houday" ? "#111827" : "#64748b",
                  }}
                >
                  放デイ
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleTypeChange(
                      recordType === "houday" ? "jihatsu" : "houday"
                    )
                  }
                  style={{
                    ...switchStyle,
                    background:
                      recordType === "jihatsu" ? "#2563eb" : "#111827",
                  }}
                >
                  <span
                    style={{
                      ...switchCircleStyle,
                      transform:
                        recordType === "jihatsu"
                          ? "translateX(34px)"
                          : "translateX(0)",
                    }}
                  />
                </button>

                <span
                  style={{
                    fontWeight: recordType === "jihatsu" ? "bold" : "normal",
                    color: recordType === "jihatsu" ? "#2563eb" : "#64748b",
                  }}
                >
                  児童発達支援
                </span>
              </div>
            </div>

            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="活動名"
              style={inputStyle}
            />

            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="活動の目的"
              rows={5}
              style={textareaStyle}
            />

            <textarea
              value={support}
              onChange={(e) => {
                const value = e.target.value;

                if (value.trim() === "") {
                  setSupport(createDefaultSupport(title, recordType));
                } else {
                  setSupport(value);
                }
              }}
              placeholder="支援内容"
              rows={12}
              style={textareaStyle}
            />

            <button onClick={saveTemplate} style={mainButtonStyle}>
              {editingId ? "更新" : "テンプレートを保存"}
            </button>

            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setPurpose("");
                  setSupport(createDefaultSupport("", recordType));
                }}
                style={subButtonStyle}
              >
                キャンセル
              </button>
            )}
          </div>

          <div style={cardStyle}>
            <h2>テンプレート検索</h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="活動名・目的・支援内容で検索"
              style={inputStyle}
            />

            {filteredTemplates.length === 0 && (
              <p style={{ color: "#64748b" }}>
                該当するテンプレートがありません
              </p>
            )}

            {filteredTemplates.map((template) => (
              <div key={template.id} style={templateCardStyle}>
                <div style={badgeStyle}>
                  {template.recordType === "jihatsu"
                    ? "児童発達支援"
                    : "放デイ"}
                </div>

                <h3>{template.title}</h3>

                <p>
                  <b>目的：</b>
                  {template.purpose}
                </p>

                <p style={{ whiteSpace: "pre-wrap" }}>{template.support}</p>

                <button onClick={() => editTemplate(template)}>編集</button>

                <button
                  onClick={() => copyTemplate(template)}
                  style={{ marginLeft: 8 }}
                >
                  {copiedId === template.id ? "コピー済み" : "コピー"}
                </button>

                <button
                  onClick={() => deleteTemplate(template.id)}
                  style={{ marginLeft: 8 }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "white",
  padding: 20,
  borderRadius: 20,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

const templateCardStyle = {
  border: "1px solid #e2e8f0",
  padding: 16,
  borderRadius: 16,
  marginTop: 12,
  background: "#ffffff",
};

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
};

const textareaStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
};

const mainButtonStyle = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const subButtonStyle = {
  padding: "10px 16px",
  borderRadius: 10,
  marginLeft: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  cursor: "pointer",
};

const switchWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const switchStyle = {
  width: 66,
  height: 32,
  borderRadius: 999,
  border: "none",
  padding: 3,
  cursor: "pointer",
  position: "relative",
  transition: "0.25s",
};

const switchCircleStyle = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: "white",
  display: "block",
  transition: "0.25s",
};

const badgeStyle = {
  display: "inline-block",
  background: "#e0f2fe",
  color: "#0369a1",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: "bold",
};
