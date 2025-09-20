"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import RepliesPanel from "@/components/RepliesPanel";

export default function CommentsSheet({
  open,
  onClose,
  articleId,
  initialList,
  onCountChange,
}: {
  open: boolean;
  onClose: () => void;
  articleId: string;
  initialList: any[];
  onCountChange?: (n: number) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed left-0 right-0 bottom-0 z-50 transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!open}
      >
        <div className="mx-auto max-w-5xl rounded-t-3xl bg-white shadow-2xl">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200" />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 p-2 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto p-4">
            <RepliesPanel
              articleId={articleId}
              initialList={initialList}
              onCountChange={onCountChange as any}
            />
          </div>
        </div>
      </div>
    </>
  );
}
