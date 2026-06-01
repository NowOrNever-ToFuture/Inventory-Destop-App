import { cn } from "@renderer/lib/utils"
import type { HTMLAttributes, Ref } from "react"

function Card({ className, ref, ...props }: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm", className)}
      {...props}
    />
  )
}
Card.displayName = "Card"

function CardHeader({ className, ref, ...props }: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  )
}
CardHeader.displayName = "CardHeader"

function CardTitle({ className, ref, ...props }: HTMLAttributes<HTMLHeadingElement> & { ref?: Ref<HTMLHeadingElement> }) {
  return (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      aria-label={typeof props.children === 'string' ? props.children : undefined}
      {...props}
    />
  )
}
CardTitle.displayName = "CardTitle"

function CardDescription({ className, ref, ...props }: HTMLAttributes<HTMLParagraphElement> & { ref?: Ref<HTMLParagraphElement> }) {
  return (
    <p ref={ref} className={cn("text-sm text-gray-500", className)} {...props} />
  )
}
CardDescription.displayName = "CardDescription"

function CardContent({ className, ref, ...props }: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
}
CardContent.displayName = "CardContent"

function CardFooter({ className, ref, ...props }: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
}
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
