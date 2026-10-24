export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>© {new Date().getFullYear()} PageTurner Books. All rights reserved.</p>
        <p className="muted">Built with React, TypeScript, Spring Boot &amp; MongoDB</p>
      </div>
    </footer>
  );
}
