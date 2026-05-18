// @ts-nocheck
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

const DEFAULT_TEMPLATE = `スタッフの送迎にて来所する。
・学習（）
・脳バランサーキッズ２

活動では「」を行いました。
〇〇を目的としております。
〇〇さんは〇〇することができました。

活動終了時に今日のお約束を再確認して、
振り返りを行ってからスタッフの送迎にて帰宅しています。`;

export default function App() {
  const [title, setTitle] =
    useState("");

  const [purpose, setPurpose] =
    useState("");

  const [support, setSupport] =
    useState(DEFAULT_TEMPLATE);

  const [templates, setTemplates] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [copiedId, setCopiedId] =
    useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const normalizeText = (
    text = ""
  ) => {
    return String(text)
      .toLowerCase()
      .replaceAll("遊び", "あそび")
      .replaceAll("アソビ", "あそび")
      .replaceAll("工作", "こうさく")
      .replaceAll("運動", "うんどう")
      .replaceAll("感覚", "かんかく")
      .replaceAll("児発", "じはつ")
      .replaceAll(
        "児童発達支援",
        "じはつ"
      )
      .replaceAll(
        "放デイ",
        "ほうでい"
      );
  };

  const loadTemplates = async () => {
    const snapshot = await getDocs(
      collection(db, "templates")
    );

    const data = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    setTemplates(data);
  };

  const saveTemplate =
    async () => {
      if (!title.trim()) {
        alert(
          "活動名を入力してください"
        );
        return;
      }

      await addDoc(
        collection(
          db,
          "templates"
        ),
        {
          title,
          purpose,
          support,
          createdAt:
            new Date(),
        }
      );

      alert("保存しました");

      setTitle("");
      setPurpose("");
      setSupport(
        DEFAULT_TEMPLATE
      );

      loadTemplates();
    };

  const deleteTemplate =
    async (id) => {
      if (
        !confirm(
          "削除しますか？"
        )
      ) {
        return;
      }

      await deleteDoc(
        doc(
          db,
          "templates",
          id
        )
      );

      loadTemplates();
    };

  const copyTemplate =
    async (template) => {
      const text = `【活動名】
${template.title}

【活動の目的】
${template.purpose}

【支援内容】
${template.support}`;

      await navigator.clipboard.writeText(
        text
      );

      setCopiedId(
        template.id
      );

      setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    };

  const filteredTemplates =
    templates.filter((template) => {
      const keyword =
        normalizeText(
          search.trim() !== ""
            ? search
            : title
        );

      if (
        keyword.trim() === ""
      ) {
        return false;
      }

      const text =
        normalizeText(
          `${template.title} ${template.purpose} ${template.support}`
        );

      return text.includes(
        keyword
      );
    });

  return (
    <div
      style={{
        background:
          "#f1f5f9",
        minHeight: "100vh",
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            textAlign:
              "center",
          }}
        >
          活動記録テンプレート
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: 20,
          }}
        >
          <div style={cardStyle}>
            <h2>
              新規テンプレート
            </h2>

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="活動名"
              style={inputStyle}
            />

            <textarea
              value={purpose}
              onChange={(e) =>
                setPurpose(
                  e.target.value
                )
              }
              placeholder="活動の目的"
              rows={5}
              style={
                textareaStyle
              }
            />

            <textarea
              value={support}
              onChange={(e) =>
                setSupport(
                  e.target.value
                )
              }
              placeholder="支援内容"
              rows={12}
              style={
                textareaStyle
              }
            />

            <button
              onClick={
                saveTemplate
              }
              style={
                mainButtonStyle
              }
            >
              テンプレート保存
            </button>
          </div>

          <div style={cardStyle}>
            <h2>
              テンプレート検索
            </h2>

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="検索"
              style={inputStyle}
            />

            {(search.trim() !==
              "" ||
              title.trim() !==
                "") &&
              filteredTemplates.length ===
                0 && (
                <p
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  該当するテンプレートがありません
                </p>
              )}

            {filteredTemplates.map(
              (template) => (
                <div
                  key={
                    template.id
                  }
                  style={
                    templateCardStyle
                  }
                >
                  <h3>
                    {
                      template.title
                    }
                  </h3>

                  <p>
                    <b>
                      目的：
                    </b>
                    {
                      template.purpose
                    }
                  </p>

                  <p
                    style={{
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {
                      template.support
                    }
                  </p>

                  <button
                    onClick={() =>
                      copyTemplate(
                        template
                      )
                    }
                  >
                    {copiedId ===
                    template.id
                      ? "コピー済み"
                      : "コピー"}
                  </button>

                  <button
                    onClick={() =>
                      deleteTemplate(
                        template.id
                      )
                    }
                    style={{
                      marginLeft: 8,
                    }}
                  >
                    削除
                  </button>
                </div>
              )
            )}
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
  boxShadow:
    "0 4px 16px rgba(0,0,0,0.08)",
};

const templateCardStyle = {
  border:
    "1px solid #e2e8f0",
  padding: 16,
  borderRadius: 16,
  marginTop: 12,
};

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  boxSizing: "border-box",
  borderRadius: 10,
  border:
    "1px solid #cbd5e1",
};

const textareaStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  boxSizing: "border-box",
  borderRadius: 10,
  border:
    "1px solid #cbd5e1",
};

const mainButtonStyle = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};
