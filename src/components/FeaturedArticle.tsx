import Link from "next/link";
import Image from "next/image";
import { Article } from "@/types/article";

function fmt(d?: string) {
  if (!d) return "";
  const t = new Date(d);
  if (isNaN(t.getTime())) return "";
  return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(t.getDate()).padStart(2, "0")}`;
}

export default function FeaturedArticle({
  item,
  count = 0,
}: {
  item: Article;
  count?: number;
}) {
  return (
    <section className="space-y-3">
      <Link href={`/articles/${item.id}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-gray-100">
          {item.hero_img ? (
            <Image
              src={item.hero_img}
              alt={item.title_ko || item.title_en}
              fill
              className="object-cover"
              priority
            />
          ) : null}
        </div>
      </Link>
      <div className="px-1">
        <Link href={`/articles/${item.id}`} className="block">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            {item.title_ko || item.title_en}
          </h2>
        </Link>
        <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
          {item.published_at && <span>{fmt(item.published_at)}</span>}
          <span>·</span>
          <span>{count} comments</span>
        </div>
      </div>
    </section>
  );
}
