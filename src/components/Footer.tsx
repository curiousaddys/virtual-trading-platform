export const Footer = () => (
  <footer className="flex justify-center gap-2 p-4 text-sm ">
    <a
      href="https://vercel.com/?utm_source=curious-addys-trading-club&utm_campaign=oss"
      target="_blank"
      rel="noreferrer"
    >
      &#9650; Powered by <b>Vercel</b>
    </a>
    <span>|</span>
    <a href="https://curiousaddys.com" target="_blank" rel="noreferrer">
      © {new Date().getFullYear()} Curious Addys’ Trading Club (CATC)
    </a>
  </footer>
)
