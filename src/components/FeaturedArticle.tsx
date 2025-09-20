import Link from "next/link";
import Image from "next/image";

type Article = {
  id: string;
  title_en: string;
  title_ko?: string;
  summary_en?: string;
  summary_ko?: string;
  url?: string;
  hero_img?: string | null;
  published_at?: string;
};

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
        {(item.summary_ko || item.summary_en) && (
          <p className="mt-2 text-[15px] leading-relaxed text-gray-700">
            {item.summary_ko || item.summary_en}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
          {item.published_at ? (
            <time dateTime={item.published_at}>{item.published_at}</time>
          ) : null}
          <span>·</span>
          <span>{count} comments</span>
        </div>
      </div>
    </section>
  );
}
