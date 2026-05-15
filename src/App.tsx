import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const purposeSuggestions = {
    新聞紙: '手先操作, 感覚刺激, 協調運動, 集中力',
    ボール: '協調運動, 空間認知, 距離感, 粗大運動',
    感覚遊び: '感覚刺激, 手先操作, 集中力, 触覚刺激',
    工作: '手先操作, 想像力, 集中力, 工程理解',
    SST: 'コミュニケーション, 対人関係, 感情理解, 距離感',
    ダンス: 'リズム感, 協調運動, 表現力, 模倣',
    縄跳び: 'バランス感覚, 持久力, リズム感, 粗大運動',
    カード: '記憶力, ルール理解, 集中力, 順番理解',
    ブロック: '空間認知, 創造力, 手先操作, 集中力',
    お絵描き: '表現力, 想像力, 手先操作, 色彩感覚',
    粘土: '触覚刺激, 手先操作, 創造力, 集中力',
    パズル: '空間認知, 問題解決, 集中力, 思考力',
    風船: '協調運動, 距離感, 反射, 空間認知',
    サーキット: '粗大運動, バランス感覚, 身体操作, 持久力',
    体操: '柔軟性, 身体操作, バランス感覚, 模倣',
    読み聞かせ: '聞く力, 想像力, 集中力, 言語理解',
    クイズ: '記憶力, 思考力, 発言力, コミュニケーション',
  };

  const createDefaultSupport = (activityTitle) => {
    return `スタッフの送迎にて来所する。
・学習（）
・脳バランサーキッズ２
活動では「${activityTitle}」を行いました。〇〇を目的としております。〇〇さんは〇〇することができました。
活動終了時に今日のお約束を再確認して、振り返りを行ってからスタッフの送迎にて帰宅しています。`;
  };

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [support, setSupport] = useState(`スタッフの送迎にて来所する。
・学習（）
・脳バランサーキッズ２
活動では「」を行いました。〇〇を目的としております。〇〇さんは〇〇することができました。
活動終了時に今日のお約束を再確認して、振り返りを行ってからスタッフの送迎にて帰宅しています。`);
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 800);
    };

    window.addEventListener('resize', checkSize);

    return () => {
      window.removeEventListener('resize', checkSize);
    };
  }, []);

  const loadTemplates = async () => {
    const snapshot = await getDocs(collection(db, 'templates'));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTemplates(data);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleTitleChange = (value) => {
    setTitle(value);
    setSupport(createDefaultSupport(value));

    const matchedKeyword = Object.keys(purposeSuggestions).find((keyword) =>
      value.includes(keyword)
    );

    if (matchedKeyword) {
      setPurpose(purposeSuggestions[matchedKeyword]);
    }
  };

  const saveTemplate = async () => {
    if (!title) {
      alert('活動名を入力してください');
      return;
    }

    if (editingId) {
      await updateDoc(doc(db, 'templates', editingId), {
        title,
        purpose,
        support,
      });
      alert('更新しました');
    } else {
      await addDoc(collection(db, 'templates'), {
        title,
        purpose,
        support,
        createdAt: new Date(),
      });
      alert('保存しました');
    }

    await loadTemplates();

    setTitle('');
    setPurpose('');
    setSupport(createDefaultSupport(''));
    setEditingId(null);
  };

  const editTemplate = (template) => {
    setEditingId(template.id);
    setTitle(template.title);
    setSupport(`スタッフの送迎にて来所する。
・学習（）
・脳バランサーキッズ２
活動では「」を行いました。〇〇を目的としております。〇〇さんは〇〇することができました。
活動終了時に今日のお約束を再確認して、振り返りを行ってからスタッフの送迎にて帰宅しています。`);
    setSupport(template.support);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteTemplate = async (id) => {
    await deleteDoc(doc(db, 'templates', id));
    await loadTemplates();
    alert('削除しました');
  };

  const copyTemplate = async (template) => {
    const text = `【活動名】
${template.title}

【活動の目的】
${template.purpose}

【支援内容】
${template.support}`;

    await navigator.clipboard.writeText(text);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredTemplates = templates.filter((template) => {
    const keyword = search.toLowerCase();
    const text =
      `${template.title} ${template.purpose} ${template.support}`.toLowerCase();
    return text.includes(keyword);
  });

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', fontSize: isMobile ? 28 : 36 }}>
          放デイ 活動記録テンプレート
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div style={cardStyle}>
            <h2>{editingId ? 'テンプレート編集中' : '新規テンプレート'}</h2>

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
              onChange={(e) => setSupport(e.target.value)}
              placeholder="支援内容"
              rows={10}
              style={textareaStyle}
            />

            <button onClick={saveTemplate} style={mainButtonStyle}>
              {editingId ? '更新' : 'テンプレートを保存'}
            </button>

            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setTitle('');
                  setPurpose('');
                  setSupport('');
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
              <p style={{ color: '#64748b' }}>
                該当するテンプレートがありません
              </p>
            )}

            {filteredTemplates.map((template) => (
              <div key={template.id} style={templateCardStyle}>
                <h3>{template.title}</h3>

                <p>
                  <b>目的：</b>
                  {template.purpose}
                </p>

                <p style={{ whiteSpace: 'pre-wrap' }}>{template.support}</p>

                <button onClick={() => editTemplate(template)}>編集</button>

                <button
                  onClick={() => copyTemplate(template)}
                  style={{ marginLeft: 8 }}
                >
                  {copiedId === template.id ? 'コピー済み' : 'コピー'}
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
  background: 'white',
  padding: 20,
  borderRadius: 20,
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

const templateCardStyle = {
  border: '1px solid #e2e8f0',
  padding: 16,
  borderRadius: 16,
  marginTop: 12,
  background: '#ffffff',
};

const inputStyle = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
  boxSizing: 'border-box',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
};

const textareaStyle = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
  boxSizing: 'border-box',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
};

const mainButtonStyle = {
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#111827',
  color: 'white',
  cursor: 'pointer',
};

const subButtonStyle = {
  padding: '10px 16px',
  borderRadius: 10,
  marginLeft: 10,
  border: '1px solid #cbd5e1',
  background: 'white',
  cursor: 'pointer',
};
