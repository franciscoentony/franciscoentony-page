import { blog, links } from "../../content/ui";
import { postUrl } from "../../lib/blog";
import CopyButton from "../ui/CopyButton";
import ExternalArrow from "../ui/ExternalArrow";

const linkClass = "transition-colors duration-300 hover:text-paper";

/**
 * Compartilhar (adendo v3): uma linha de texto sob a assinatura.
 * "Copiar link · LinkedIn ↗ · WhatsApp ↗" (o ↗ só nos externos).
 */
export default function ShareLine({ title }: { title: string }) {
  const url = postUrl();
  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const whatsApp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  return (
    <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2 text-body-sm text-prose">
      <CopyButton
        value={postUrl}
        idle={blog.post.copyLink}
        done={blog.post.linkCopied}
        failed={blog.post.copyFailed}
      />
      <a
        href={linkedIn}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {blog.post.linkedIn}
        <ExternalArrow />
        <span className="sr-only"> {links.newTabLabel}</span>
      </a>
      <a
        href={whatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {blog.post.whatsApp}
        <ExternalArrow />
        <span className="sr-only"> {links.newTabLabel}</span>
      </a>
    </div>
  );
}
