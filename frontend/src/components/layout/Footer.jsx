export default function Footer() {
  return (
    <footer className="border-t border-nil-border/60 bg-nil-black/80 backdrop-blur-sm relative z-10">
      <div className="max-w-[1200px] mx-auto h-20 px-6 flex items-center justify-between">
        <p className="text-nil-grey text-sm">
          nil protocol — built on Arbitrum
        </p>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-nil-grey text-sm hover:text-nil-white transition-colors duration-200"
          >
            GitHub
          </a>
          <a
            href="https://sepolia.arbiscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-nil-grey text-sm hover:text-nil-white transition-colors duration-200"
          >
            Arbiscan
          </a>
        </div>
      </div>
    </footer>
  );
}
