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
import kuromoji from "kuromoji";
import * as wanakana from "wanakana";

let tokenizer = null;

kuromoji
  .builder({
    dicPath:
      "https://unpkg.com/kuromoji@0.1.2/dict",
  })
  .build((err, builtTokenizer) => {
    tokenizer = builtTokenizer;
  });

const normalizeJapaneseText = (
  text = ""
) => {
  if (!tokenizer) {
    return text.toLowerCase();
  }

  const tokens = tokenizer.tokenize(text);

  const hira = tokens
    .map((token) => {
      return wanakana.toHiragana(
        token.reading ||
          token.surface_form
      );
    })
    .join("");

  return hira.toLowerCase();
};

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
  const [recordType, setRecordType] =
    useState("houday");

  const [title, setTitle] =
    useState("");

  const [purpose, setPurpose] =
    useState("");

  const [support, setSupport] =
    useState(
      DEFAULT_HOUDAY_TEMPLATE
    );

  const [templates, setTemplates] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [copiedId, setCopiedId] =
    useState(null);

  const displayKeyword =
    search.trim() !== ""
      ? search
      : title;

  useEffect(() => {
    loadTemplates();
  }, []);

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

  const filteredTemplates =
    templates.filter((template) => {
      const keyword =
        normalizeJapaneseText(
          displayKeyword
        );

      if (keyword.trim() === "") {
        return false;
      }

      const typeLabel =
        template.recordType ===
        "jihatsu"
          ? "児童発達支援 児発"
          : "放デイ";

      const text =
        normalizeJapaneseText(
          `${typeLabel} ${template.title} ${template.purpose} ${template.support}`
        );

      return text.includes(keyword);
    });

  const copyTemplate = async (
    template
  ) => {
    const text = `【活動名】
${template.title}

【目的】
${template.purpose}

【支援内容】
${template.support}`;

    await navigator.clipboard.writeText(
      text
    );

    setCopiedId(template.id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  return (
    <div
      style={{
        background: "#f1f5f9",
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
            textAlign: "center",
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
              placeholder="活動目的"
              rows={4}
              style={textareaStyle}
            />

            <textarea
              value={support}
              onChange={(e) =>
                setSupport(
                  e.target.value
                )
              }
              placeholder="支援内容"
              rows={10}
              style={textareaStyle}
            />
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

            {displayKeyword.trim() !==
              "" &&
              filteredTemplates.length ===
                0 && (
                <p
                  style={{
                    color: "#64748b",
                  }}
                >
                  該当するテンプレートがありません
                </p>
              )}

            {displayKeyword.trim() !==
              "" &&
              filteredTemplates.map(
                (template) => (
                  <div
                    key={
                      template.id
                    }
                    style={
                      templateCardStyle
                    }
                  >
                    <div
                      style={
                        badgeStyle
                      }
                    >
                      {template.recordType ===
                      "jihatsu"
                        ? "児童発達支援"
                        : "放デイ"}
                    </div>

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
  border: "1px solid #e2e8f0",
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

const badgeStyle = {
  display: "inline-block",
  background: "#e0f2fe",
  color: "#0369a1",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: "bold",
};
