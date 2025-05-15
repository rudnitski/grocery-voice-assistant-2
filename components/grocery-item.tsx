"use client"

import { Minus, Plus } from "lucide-react"
import { useState } from "react"

interface GroceryItemProps {
  item: { id: string; name: string; quantity: number }
  updateQuantity: (id: string, change: number) => void
}

export default function GroceryItem({ item, updateQuantity }: GroceryItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <li
      className="flex items-center justify-between p-4 bg-gray-800/60 rounded-2xl transition-all duration-300 border border-transparent hover:border-pink-500/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-xl text-pink-400 font-medium">
          {item.quantity}
        </div>
        <span className="font-medium capitalize text-white">{item.name}</span>
      </div>

      <div
        className={`flex items-center gap-2 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        }`}
      >
        <button
          onClick={() => updateQuantity(item.id, -1)}
          className="p-2 rounded-full bg-gray-700 hover:bg-rose-500/80 transition-colors"
          aria-label={`Decrease ${item.name} quantity`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => updateQuantity(item.id, 1)}
          className="p-2 rounded-full bg-gray-700 hover:bg-pink-500/80 transition-colors"
          aria-label={`Increase ${item.name} quantity`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  )
}
