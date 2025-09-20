"use client";

import { useState } from "react";
import { Article } from "@/types/article";
import ArticleCard from "@/components/ArticleCard";
import CommentsSheet from "@/components/CommentsSheet";

export default function ArticleDetailClient({
  item,
  initialReplies,
}: {
  item: Article;
  initialReplies: any[];
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialReplies.length);

  return (
    <>
      <ArticleCard
        a={item}
        variant="detail"
        commentCount={count}
        onCommentsClick={() => setOpen(true)}
      />
      <CommentsSheet
        open={open}
        onClose={() => setOpen(false)}
        articleId={item.id}
        initialList={initialReplies}
        onCountChange={(n) => setCount(n)}
      />
    </>
  );
}
