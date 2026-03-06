import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-indigo-900/50 text-indigo-300',
        tasks: 'bg-indigo-900/50 text-indigo-300',
        shopping: 'bg-green-900/50 text-green-300',
        expenses: 'bg-orange-900/50 text-orange-300',
        documents: 'bg-blue-900/50 text-blue-300',
        success: 'bg-green-900/50 text-green-300',
        warning: 'bg-yellow-900/50 text-yellow-300',
        error: 'bg-red-900/50 text-red-300',
        secondary: 'bg-slate-700 text-slate-300',
        outline: 'border border-slate-600 text-slate-300'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
