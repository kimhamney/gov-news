"use client";
import { useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import CommentsSheet from "@/components/CommentsSheet";
import RepliesPanel from "@/components/RepliesPanel";
import { Article } from "@/types/article";

export default function DetailClient({
  item,
  initialReplies,
}: {
  item: Article;
  initialReplies?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialReplies?.length ?? 0);

  return (
    <>
      <ArticleCard
        a={item}
        variant="detail"
        commentCount={count}
        onCommentsClick={() => setOpen(true)}
      />
      <CommentsSheet open={open} onOpenChange={setOpen}>
        <RepliesPanel
          articleId={item.id}
          initialList={initialReplies}
          onCountChange={(n: number) => setCount(n)}
          autoFocus
        />
      </CommentsSheet>
    </>
  );
}
