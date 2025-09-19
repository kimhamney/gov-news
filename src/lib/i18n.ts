"use client";
import { useLocaleMode } from "@/lib/localePref";

type Entry = { en: string; ko?: string };
type Dict = Record<
  | "ui.brand"
  | "ui.sort"
  | "ui.sort.newest"
  | "ui.sort.oldest"
  | "ui.sort.title"
  | "ui.login"
  | "ui.logout"
  | "ui.openOriginal"
  | "ui.welcome"
  | "ui.setNicknameEmail"
  | "ui.nickname"
  | "ui.email"
  | "ui.save"
  | "ui.saving"
  | "ui.loading"
  | "ui.noScraps"
  | "ui.noComments"
  | "ui.writeComment"
  | "ui.post"
  | "ui.posting"
  | "ui.goToArticle"
  | "ui.needSignin"
  | "ui.saved"
  | "ui.saveText"
  | "ui.edit"
  | "ui.delete"
  | "ui.cancel"
  | "ui.update"
  | "ui.updating"
  | "ui.confirmDelete"
  | "ui.edited",
  Entry
>;

const dict: Dict = {
  "ui.brand": { en: "GOVNEWS", ko: "GOVNEWS" },
  "ui.sort": { en: "Sort", ko: "정렬" },
  "ui.sort.newest": { en: "Newest", ko: "최신순" },
  "ui.sort.oldest": { en: "Oldest", ko: "오래된순" },
  "ui.sort.title": { en: "Title", ko: "제목순" },
  "ui.login": { en: "Login", ko: "로그인" },
  "ui.logout": { en: "Logout", ko: "로그아웃" },
  "ui.openOriginal": { en: "Open original", ko: "원문 보기" },
  "ui.welcome": { en: "Welcome!", ko: "환영합니다!" },
  "ui.setNicknameEmail": {
    en: "Set your nickname and email.",
    ko: "닉네임과 이메일을 설정해 주세요.",
  },
  "ui.nickname": { en: "Nickname", ko: "닉네임" },
  "ui.email": { en: "Email", ko: "이메일" },
  "ui.save": { en: "Save", ko: "저장" },
  "ui.saving": { en: "Saving...", ko: "저장중..." },
  "ui.loading": { en: "Loading...", ko: "불러오는 중..." },
  "ui.noScraps": { en: "No scraps.", ko: "스크랩이 없습니다." },
  "ui.noComments": { en: "No comments.", ko: "댓글이 없습니다." },
  "ui.writeComment": { en: "Write a comment", ko: "댓글을 입력하세요" },
  "ui.post": { en: "Post", ko: "등록" },
  "ui.posting": { en: "Posting...", ko: "작성중..." },
  "ui.goToArticle": { en: "Go to article", ko: "기사로 이동" },
  "ui.needSignin": {
    en: "Please sign in to use this page.",
    ko: "로그인 후 이용할 수 있습니다.",
  },
  "ui.saved": { en: "Saved", ko: "저장됨" },
  "ui.saveText": { en: "Save", ko: "저장" },
  "ui.edit": { en: "Edit", ko: "수정" },
  "ui.delete": { en: "Delete", ko: "삭제" },
  "ui.cancel": { en: "Cancel", ko: "취소" },
  "ui.update": { en: "Update", ko: "수정완료" },
  "ui.updating": { en: "Updating...", ko: "수정중..." },
  "ui.confirmDelete": {
    en: "Delete this comment?",
    ko: "이 댓글을 삭제할까요?",
  },
  "ui.edited": { en: "(edited)", ko: "(수정됨)" },
};

function pick(mode: "en" | "ko" | "mix", en: string, ko?: string) {
  if (mode === "en") return en || ko || "";
  if (mode === "ko") return ko || en || "";
  if (en && ko) return `${ko} / ${en}`;
  return ko || en || "";
}

export function useT() {
  const { mode } = useLocaleMode();
  return (key: keyof Dict) => {
    const e = dict[key];
    return pick(mode, e.en, e.ko);
  };
}
