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
  const [houdayTemplate, setHoudayTemplate] = useState(DEFAULT_HOUDAY_TEMPLATE);
  const [jihatsuTemplate, setJihatsuTemplate] = useState(DEFAULT_JIHATSU_TEMPLATE);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [purposeEdited, setPurposeEdited] = useState(false);
  const [support, setSupport] = useState(DEFAULT_HOUDAY_TEMPLATE);

  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState("");

  const [isGeneratingPurpose, setIsGeneratingPurpose] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  const applyActivityTitle = (template, activityTitle = "") => {
    if (template.includes("活動では「")) {
      return template.replace(/活動では「.*?」/, `活動では「${activityTitle}」`);
    }

    return `${template}

活動では「${activityTitle}」を行いました。`;
  };

  const createDefaultSupport = (activityTitle = "", type = recordType) => {
    const base = type === "jihatsu" ? jihatsuTemplate : houdayTemplate;
    return applyActivityTitle(base, activityTitle);
  };

  useEffect(() => {
    const savedHouday = localStorage.getItem("houdayDefaultTemplate");
    const savedJihatsu = localStorage.getItem("jihatsuDefaultTemplate");

    if (savedHouday) setHoudayTemplate(savedHouday);
    if (savedJihatsu) setJihatsuTemplate(savedJihatsu);

    setSupport(applyActivityTitle(savedHouday || DEFAULT_HOUDAY_TEMPLATE, ""));

    loadTemplates();
  }, []);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 800);
    };

    window.addEventListener("resize", checkSize);

    return () => {
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  useEffect(() => {
    if (!title.trim()) return;
    if (purposeEdited) return;

    const timer = setTimeout(() => {
      generatePurpose(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [title, purposeEdited]);

  const loadTemplates = async () => {
    const snapshot = await getDocs(collection(db, "templates"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const sorted = data.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    setTemplates(sorted);
  };

  const generatePurpose = async (showAlert = true) => {
    if (!title.trim()) {
      if (showAlert) alert("先に活動名を入力してください");
      return;
    }

    try {
      setIsGeneratingPurpose(true);

      const response = await fetch("/api/suggest-purpose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          templates,
        }),
      });

      const data = await response.json();

      if (data?.purpose) {
        setPurpose(data.purpose);
        setPurposeEdited(false);
      } else if (showAlert) {
        alert("AI生成失敗");
      }
    } catch (error) {
      console.error(error);

      if (showAlert) {
        alert("AI生成失敗");
      }
    } finally {
      setIsGeneratingPurpose(false);
    }
  };

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

    if (purpose.trim() === "") {
      setPurposeEdited(false);
    }
  };

  const saveDefaultTemplates = () => {
    localStorage.setItem("houdayDefaultTemplate", houdayTemplate);
    localStorage.setItem("jihatsuDefaultTemplate", jihatsuTemplate);

    setSupport(createDefaultSupport(title, recordType));

    alert("保存しました");
  };

  const resetDefaultTemplates = () => {
    setHoudayTemplate(DEFAULT_HOUDAY_TEMPLATE);
    setJihatsuTemplate(DEFAULT_JIHATSU_TEMPLATE);

    localStorage.setItem("houdayDefaultTemplate", DEFAULT_HOUDAY_TEMPLATE);
    localStorage.setItem("jihatsuDefaultTemplate", DEFAULT_JIHATSU_TEMPLATE);

    setSupport(
      recordType === "jihatsu"
        ? applyActivityTitle(DEFAULT_JIHATSU_TEMPLATE, title)
        : applyActivityTitle(DEFAULT_HOUDAY_TEMPLATE, title)
    );

    alert("初期状態に戻しました");
  };

  const saveTemplate = async () => {
    if (!title.trim()) {
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

    setEditingId(null);
    setTitle("");
    setPurpose("");
    setPurposeEdited(false);
    setSupport(createDefaultSupport("", recordType));
  };

  const editTemplate = (template) => {
    const type = template.recordType || "houday";

    setEditingId(template.id);
    setRecordType(type);
    setTitle(template.title || "");
    setPurpose(template.purpose || "");
    setPurposeEdited(true);
    setSupport(template.support || createDefaultSupport(template.title || "", type));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteTemplate = async (id) => {
    if (!confirm("削除してもよろしいですか？")) return;

    await deleteDoc(doc(db, "templates", id));

    await loadTemplates();

    alert("削除しました");
  };

  const copyTemplate = async (template) => {
    const label = template.recordType === "jihatsu" ? "児童発達支援" : "放デイ";

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

  const displayKeyword = search.trim() !== "" ? search : title;

  const filteredTemplates = templates.filter((template) => {
    const keyword = displayKeyword.toLowerCase();

    if (keyword.trim() === "") {
      return false;
    }

    const typeLabel =
      template.recordType === "jihatsu" ? "児童発達支援 児発" : "放デイ";

    const text =
      `${typeLabel} ${template.title} ${template.purpose} ${template.support}`.toLowerCase();

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
                    handleTypeChange(recordType === "houday" ? "jihatsu" : "houday")
                  }
                  style={{
                    ...switchStyle,
                    background: recordType === "jihatsu" ? "#2563eb" : "#111827",
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

            <button
              onClick={() => setShowTemplateEditor(!showTemplateEditor)}
              style={subButtonStyle}
            >
              {showTemplateEditor ? "初期テンプレ編集を閉じる" : "初期テンプレ編集"}
            </button>

            {showTemplateEditor && (
              <div style={templateEditorStyle}>
                <p style={{ fontWeight: "bold" }}>放デイ用</p>

                <textarea
                  value={houdayTemplate}
                  onChange={(e) => setHoudayTemplate(e.target.value)}
                  rows={8}
                  style={textareaStyle}
                />

                <p style={{ fontWeight: "bold" }}>児発用</p>

                <textarea
                  value={jihatsuTemplate}
                  onChange={(e) => setJihatsuTemplate(e.target.value)}
                  rows={10}
                  style={textareaStyle}
                />

                <button onClick={saveDefaultTemplates} style={mainButtonStyle}>
                  初期テンプレ保存
                </button>

                <button onClick={resetDefaultTemplates} style={subButtonStyle}>
                  初期状態に戻す
                </button>
              </div>
            )}

            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="活動名"
              style={inputStyle}
            />

            <button
              onClick={() => generatePurpose(true)}
              disabled={isGeneratingPurpose}
              style={{
                ...mainButtonStyle,
                marginBottom: 12,
                background: isGeneratingPurpose ? "#94a3b8" : "#2563eb",
              }}
            >
              {isGeneratingPurpose ? "AI生成中..." : "AIで目的を再生成"}
            </button>

            <textarea
              value={purpose}
              onChange={(e) => {
                const value = e.target.value;

                setPurpose(value);
                setPurposeEdited(value.trim() !== "");
              }}
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
              {editingId ? "更新" : "テンプレート保存"}
            </button>

            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setPurpose("");
                  setPurposeEdited(false);
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
              placeholder="検索"
              style={inputStyle}
            />

            {displayKeyword.trim() !== "" && filteredTemplates.length === 0 && (
              <p style={{ color: "#64748b" }}>
                該当するテンプレートがありません
              </p>
            )}

            {displayKeyword.trim() !== "" &&
              filteredTemplates.map((template) => (
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
};

const templateEditorStyle = {
  marginTop: 16,
  marginBottom: 16,
  padding: 16,
  borderRadius: 16,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
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
