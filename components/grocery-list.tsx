import GroceryItem from "./grocery-item"
import { Measurement } from "../lib/types/grocery-types"
import { Copy } from "lucide-react"
import { Button } from "./ui/button"

interface GroceryListProps {
  items: Array<{ id: string; name: string; quantity: number; measurement?: Measurement }>
  updateQuantity: (id: string, change: number) => void
  onExport: () => void
}

export default function GroceryList({ items, updateQuantity, onExport }: GroceryListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-semibold">Grocery List</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { console.log('[DEBUG] Export button clicked'); onExport(); }}
          disabled={items.length === 0}
          aria-label="Export grocery list"
        >
          <Copy className="size-4" />
        </Button>
      </div>
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-800 min-h-[250px] flex-grow">
        {items.length > 0 ? (
          <ul className="space-y-4">
            {items.map((item) => (
              <GroceryItem key={item.id} item={item} updateQuantity={updateQuantity} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 italic">Detected grocery items will appear here...</p>
            <p className="text-gray-600 text-sm mt-2">Items will be automatically extracted from your speech</p>
          </div>
        )}
      </div>
    </div>
  )
}
