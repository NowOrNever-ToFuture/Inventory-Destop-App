import { Slot } from '@radix-ui/react-slot'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@renderer/lib/utils'
import { buttonVariants } from '@renderer/lib/variants'
import type { ComponentProps } from 'react'

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ElementType
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon: Icon,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props}>
      {Icon && <Icon className="mr-2 size-4 shrink-0" />}
      {children}
    </Comp>
  )
}
Button.displayName = 'Button'

export { Button }
