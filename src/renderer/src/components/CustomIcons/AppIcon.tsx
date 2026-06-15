import browserIcon from '../../assets/icon.png'
import { cn } from '../../lib/utils'

interface AppIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Additional class names for the icon */
  className?: string
  /** Size of the icon (e.g., 16, 24, 32, 48) */
  size?: number
}

/**
 * Custom AppIcon component that wraps the browser icon image
 * for consistent usage throughout the application.
 */
export function AppIcon({ className, size = 24, ...props }: AppIconProps) {
  return (
    <img
      src={browserIcon}
      alt="Gaspra Browser"
      className={cn(
        'object-contain select-none', 
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    />
  )
}
