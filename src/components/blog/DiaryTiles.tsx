import { Link } from "react-router-dom";
import { blog } from "../../content/ui";
import type { Post } from "../../data/posts";
import type { PostsStatus } from "../../hooks/usePosts";
import { resolveAssetPath, resolveContentHtml } from "../../lib/blog";
import { formatMediumDate, readMinutes } from "../../lib/date";
import { getPostPhoto } from "../../lib/postContent";
import { decodeHtmlEntities } from "../../lib/text";
import MediaFrame from "../ui/MediaFrame";
import Reveal from "../ui/Reveal";

/** Um post: a foto (a mesma capa da página do post), o título e a data. */
function DiaryTile({ post, ratio }: { post: Post; ratio: string }) {
  const photo = getPostPhoto(
    post.cover ? resolveAssetPath(post.cover) : null,
    resolveContentHtml(post.content),
  );
  const minutes = readMinutes(post.readTime);

  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      {photo && (
        <MediaFrame
          src={photo.src}
          alt=""
          ratio={ratio}
          width={photo.width}
          height={photo.height}
          sizes="(min-width: 860px) 600px, calc(100vw - 48px)"
          className="photo"
          imgClassName="duration-1200 ease-page group-hover:scale-[1.03]"
        />
      )}
      <h3 className="mt-4.5 text-tile text-balance decoration-accent-soft/60 decoration-[1.5px] underline-offset-[0.18em] group-hover:underline">
        {decodeHtmlEntities(post.title)}
      </h3>
      <p className="mt-2 text-caption text-secondary">
        {formatMediumDate(post.date)}
        {minutes && ` · ${blog.post.readTime(minutes)}`}
      </p>
    </Link>
  );
}

/**
 * Diário na Home (adendo v4, item 12): as fotos dos 2 posts mais recentes
 * fazem o card (sem caixa, hash nem data mono) e, no fim, uma linha em dois
 * tons leva ao blog ("Mais registros no diário. Todos os posts").
 */
export default function DiaryTiles({
  status,
  posts,
}: {
  status: PostsStatus;
  posts: Post[];
}) {
  if (status === "loading") {
    return (
      <p role="status" className="text-secondary">
        {blog.loading}
      </p>
    );
  }
  if (status === "error") {
    return (
      <p role="status" className="text-secondary">
        {blog.error}
      </p>
    );
  }
  if (posts.length === 0) return <p className="text-secondary">{blog.empty}</p>;

  return (
    <>
      <ul className="grid items-start gap-7 tab:grid-cols-[1.25fr_1fr]">
        {posts.slice(0, 2).map((post, index) => (
          <li
            key={post.slug}
            className="[--tile-ratio:16/10] tab:[--tile-ratio:4/3]"
          >
            <Reveal delay={(index + 1) as 1 | 2}>
              {/* O 2º fica 4:3 ao lado do 1º (16:10); no celular, os dois 16:10 */}
              <DiaryTile
                post={post}
                ratio={index === 0 ? "16 / 10" : "var(--tile-ratio)"}
              />
            </Reveal>
          </li>
        ))}
      </ul>
      <Link
        to="/blog"
        className="mt-14 inline-block text-more decoration-accent-soft/60 underline-offset-[0.18em] hover:underline"
      >
        {/* secondary, não kicker: em 22–30px semibold ainda não é "texto
            grande" para o AA e o #6e6e73 dá 4.1:1 (D17) */}
        <span className="text-secondary">{blog.inviteTitle}.</span>{" "}
        {blog.allPostsLink}
      </Link>
    </>
  );
}
