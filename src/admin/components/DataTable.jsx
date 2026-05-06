import React from 'react';
import { Trash2, Edit2, Lock, Unlock } from 'lucide-react';

export default function DataTable({ columns, data, actions, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {actions.edit && (
                        <button
                          onClick={() => actions.edit(row)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Éditer"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {actions.delete && (
                        <button
                          onClick={() => actions.delete(row)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {actions.toggle && (
                        <button
                          onClick={() => actions.toggle(row)}
                          className="text-orange-600 hover:text-orange-800 p-1"
                          title={row.blocked ? 'Débloquer' : 'Bloquer'}
                        >
                          {row.blocked ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune donnée disponible</p>
        </div>
      )}
    </div>
  );
}
