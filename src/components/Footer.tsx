import { Link } from "react-router-dom";
import { footer, links } from "../content/ui";
import Container from "./ui/Container";

const linkClass = "transition-colors duration-200 hover:text-paper";

export default function Footer() {
  return (
    <footer className="border-t border-line pt-gutter pb-10 text-xs text-secondary">
      <Container className="flex flex-wrap justify-between gap-4">
        <p>{footer.copyright}</p>

        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap gap-gutter">
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
