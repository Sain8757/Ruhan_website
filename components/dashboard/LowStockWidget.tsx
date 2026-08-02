import React from 'react';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
}

interface LowStockWidgetProps {
  items: LowStockItem[];
}

export default function LowStockWidget({ items }: LowStockWidgetProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
      <div className="p-4 border-b border-red-50 bg-red-50/50 flex items-center gap-2 text-red-700">
        <AlertTriangle size={18} className="text-red-500" />
        <h3 className="font-semibold">Low Stock Alerts</h3>
      </div>
      
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <Package size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{item.name}</p>
                <p className="text-xs text-red-500 font-medium">Only {item.quantity} left (Min: {item.minStock})</p>
              </div>
            </div>
            
            <Link 
              href={`/inventory`}
              className="px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
            >
              Update
            </Link>
          </div>
        ))}
      </div>
      
      <Link href="/inventory" className="block w-full p-3 text-center text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors border-t border-gray-100">
        View All Inventory <ArrowRight size={14} className="inline ml-1" />
      </Link>
    </div>
  );
}
