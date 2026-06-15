
interface SearchEngineIconProps {
  /** Search engine name (e.g., 'google', 'bing', etc.) */
  engine: string
  /** Additional class names for the icon */
  className?: string
  /** Size of the icon */
  size?: number
}

/**
 * SearchEngineIcon component that displays the appropriate icon for each search engine
 */
export function SearchEngineIcon({ engine, className, size = 16 }: SearchEngineIconProps) {
  // SVG icons for search engines
  const icons: Record<string, React.ReactNode> = {
    google: (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
      >
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    bing: (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
      >
        <path
          fill="#00809D"
          d="M17.61 19.91L6.05 14.4c-.36-.17-.58-.52-.6-.9-.02-.38.18-.74.54-.93l6.71-3.58c.35-.19.68-.24.99-.16.31.08.57.27.78.58.21.31.28.66.22 1.05l-.52 3.42 3.09-1.65c.35-.19.72-.19 1.07 0 .35.19.53.54.53 1.05s-.18.86-.53 1.05l-4.07 2.17-1.02 5.11c-.07.35-.29.65-.65.91-.36.26-.78.37-1.27.34-.49-.03-.92-.2-1.27-.51l-2.24-1.99c-.3-.27-.45-.62-.45-1.04 0-.42.15-.77.45-1.04l11.02-8.27c.27-.2.59-.3.95-.3.36 0 .68.1.95.3.27.2.45.47.53.82.08.35.05.72-.1 1.09L10.83 18.1l-.63 3.11c-.07.35-.02.69.13 1.01.15.32.37.58.65.79.28.21.6.34.95.39.35.05.7.02 1.02-.09.32-.11.6-.3.84-.57l4.07-4.53c.27-.3.42-.67.45-1.11.03-.44-.09-.86-.36-1.24"
        />
      </svg>
    ),
    duckduckgo: (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
      >
        <path
          fill="#DE5833"
          d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.3 0 9.6 4.3 9.6 9.6s-4.3 9.6-9.6 9.6S2.4 17.3 2.4 12 6.7 2.4 12 2.4z"
        />
        <circle cx="9" cy="10" r="1.5" fill="#fff" />
        <circle cx="15" cy="10" r="1.5" fill="#fff" />
        <path d="M9.5 14c1.1 0 2.5 1.5 2.5 1.5s1.4-1.5 2.5-1.5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    yahoo: (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
      >
        <path
          fill="#6001D2"
          d="M12.5 4.5L6.5 16h2.5l1.5-3.5h4l1.5 3.5h2.5L11.5 4.5z"
        />
        <path
          fill="#6001D2"
          d="M5 18h2v4H5z"
        />
        <path
          fill="#6001D2"
          d="M17 18h2v4h-2z"
        />
      </svg>
    )
  }

  // Default to Google icon if engine not found
  return icons[engine] || icons.google
}
