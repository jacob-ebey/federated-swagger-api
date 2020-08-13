import { h } from "preact";

export default function Shell({ children }) {
  return (
    <div className="shell">
      <nav>
        <ul>
          <li>Home</li>
          <li>About</li>
        </ul>
      </nav>

      {children}
    </div>
  );
}
