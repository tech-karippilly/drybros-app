'use client';

import React from 'react';

interface Column {
  key: string;
  label: string;
  type?: 'number' | 'text';
  placeholder?: string;
}

interface DynamicTierTableProps {
  tiers: Record<string, any>[];
  columns: Column[];
  onChange: (tiers: Record<string, any>[]) => void;
  addButtonLabel?: string;
  emptyMessage?: string;
}

const PlusIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const DynamicTierTable: React.FC<DynamicTierTableProps> = ({
  tiers,
  columns,
  onChange,
  addButtonLabel = 'Add Tier',
  emptyMessage = 'No tiers added yet. Click the button below to add.',
}) => {
  const handleAddTier = () => {
    const newTier: Record<string, any> = {};
    columns.forEach((col: Column) => {
      newTier[col.key] = col.type === 'number' ? 0 : '';
    });
    onChange([...tiers, newTier]);
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = [...tiers];
    newTiers.splice(index, 1);
    onChange(newTiers);
  };

  const handleUpdateTier = (index: number, key: string, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [key]: value };
    onChange(newTiers);
  };

  return (
    <div className="space-y-4">
      {tiers.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                {columns.map((col: Column) => (
                  <th
                    key={col.key}
                    className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tiers.map((tier: Record<string, any>, index: number) => (
                <tr key={index} className="hover:bg-gray-800/30">
                  {columns.map((col: Column) => (
                    <td key={col.key} className="py-3 px-4">
                      <input
                        type={col.type || 'text'}
                        value={tier[col.key] || ''}
                        onChange={(e) =>
                          handleUpdateTier(
                            index,
                            col.key,
                            col.type === 'number'
                              ? parseFloat(e.target.value) || 0
                              : e.target.value
                          )
                        }
                        placeholder={col.placeholder}
                        className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRemoveTier(index)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove tier"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={handleAddTier}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/50 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
        {addButtonLabel}
      </button>
    </div>
  );
};
