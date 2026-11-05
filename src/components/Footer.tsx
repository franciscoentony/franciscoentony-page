import { Link } from "react-router-dom";
import { footer, links } from "../content/ui";
import Container from "./ui/Container";

// inline-block + py-1.5: área de toque de pelo menos 24px de altura (DF-18, WCAG 2.5.8)
const linkClass =
  "inline-block py-1.5 transition-[color] duration-200 hover:text-paper";

export default function Footer() {
  return (
    <footer className="border-t border-line pt-4 pb-8.5 text-xs text-secondary">
      <Container className="flex flex-wrap items-center justify-between gap-x-4">
        <p>{footer.copyright}</p>

        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap gap-x-5">
            <li>
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {footer.github}
                <span className="sr-only"> {links.newTabLabel}</span>
              </a>
            </li>
            <li>
              <a
                href={links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {footer.linkedin}
                <span className="sr-only"> {links.newTabLabel}</span>
              </a>
            </li>
            <li>
              <Link to="/blog" className={linkClass}>
                {footer.blog}
              </Link>
            </li>
            <li>
              <a href="#top" className={linkClass}>
                {footer.backToTop}
              </a>
            </li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
