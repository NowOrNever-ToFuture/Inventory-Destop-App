import { cn } from "@renderer/lib/utils"
import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, Ref } from "react"

function Table({ className, ref, ...props }: HTMLAttributes<HTMLTableElement> & { ref?: Ref<HTMLTableElement> }) {
  return (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}
Table.displayName = "Table"

function TableHeader({ className, ref, ...props }: HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) {
  return <thead ref={ref} className={cn("[&_tr]:border-b bg-gray-50", className)} {...props} />
}
TableHeader.displayName = "TableHeader"

function TableBody({ className, ref, ...props }: HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) {
  return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0 divide-y divide-gray-200", className)} {...props} />
}
TableBody.displayName = "TableBody"

function TableFooter({ className, ref, ...props }: HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) {
  return <tfoot ref={ref} className={cn("border-t bg-gray-50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
}
TableFooter.displayName = "TableFooter"

function TableRow({ className, ref, ...props }: HTMLAttributes<HTMLTableRowElement> & { ref?: Ref<HTMLTableRowElement> }) {
  return <tr ref={ref} className={cn("border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-100", className)} {...props} />
}
TableRow.displayName = "TableRow"

function TableHead({ className, ref, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { ref?: Ref<HTMLTableCellElement> }) {
  return <th ref={ref} className={cn("h-10 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0", className)} {...props} />
}
TableHead.displayName = "TableHead"

function TableCell({ className, ref, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { ref?: Ref<HTMLTableCellElement> }) {
  return <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
}
TableCell.displayName = "TableCell"

function TableCaption({ className, ref, ...props }: HTMLAttributes<HTMLTableCaptionElement> & { ref?: Ref<HTMLTableCaptionElement> }) {
  return <caption ref={ref} className={cn("mt-4 text-sm text-gray-500", className)} {...props} />
}
TableCaption.displayName = "TableCaption"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
