import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Copy } from "lucide-react"

export interface ExportDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean
  /** Callback fired when the dialog requests to close */
  onClose: () => void
  /** Pre-formatted grocery list text */
  textToCopy: string
}

/**
 * ExportDialog component provides a dialog interface for exporting grocery lists.
 * 
 * This component displays the formatted grocery list in a textarea and provides
 * buttons for copying the content to clipboard and closing the dialog.
 * It uses the Clipboard API with a fallback mechanism if the API is not available.
 * 
 * @param props - Component props
 * @returns A React component that renders a dialog with export functionality
 */
export default function ExportDialog({ isOpen, onClose, textToCopy }: ExportDialogProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  /**
   * Handles the copy action when the user clicks the Copy button.
   * 
   * Attempts to use the Clipboard API to copy text, and falls back to
   * selecting the text for manual copy if the API fails. Shows appropriate
   * toast notifications for both success and failure cases.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      toast({
        title: "Copied!",
        description: "The list is now on your clipboard.",
        variant: "default",
        duration: 3000 // Show for 3 seconds
      })
    } catch (err) {
      // Fallback: select the text for manual copy
      textareaRef.current?.select()
      toast({
        title: "Copy failed",
        description: "Text selected for manual copy. Use Ctrl+C/Cmd+C to copy.",
        variant: "destructive",
        duration: 3000
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Grocery List</DialogTitle>
        </DialogHeader>
        <Textarea
          ref={textareaRef}
          value={textToCopy}
          readOnly
          rows={10}
          className="bg-gray-800 text-sm font-mono h-48 resize-none"
        />
        <DialogFooter className="mt-4 space-x-2 sm:space-x-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} type="button">
            Close
          </Button>
          <Button onClick={handleCopy} type="button" className="flex gap-2 items-center">
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
