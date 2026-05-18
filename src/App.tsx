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

  const [recordType, setRecordType] = useState("houday");
  const [houdayTemplate, setHoudayTemplate] = useState(DEFAULT_HOUDAY_TEMPLATE);
  const [jihatsuTemplate, setJihatsuTemplate] = useState(DEFAULT_JIHATSU_TEMPLATE);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  const applyActivityTitle = (template, activityTitle = "") => {
    if (template.includes("活動では「")) {
      return template.replace(/活動では「.*?」/, `活動では「${activityTitle}」`);
    }
};
