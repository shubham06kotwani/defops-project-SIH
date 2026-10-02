import React, { useState } from 'react';
import { Plus, Filter } from 'lucide-react';

export default function Requisitions({ indents, onAddIndent, onUpdateStatus }) {
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const [unitName, setUnitName] = useState('');
  const [category, setCategory] = useState('AMMUNITION');
  const [quantity, setQuantity] = useState(500);
  const [priority, setPriority] = useState('HIGH');

  const filteredIndents = indents.filter(item => {
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!unitName.trim() || !quantity) return;

    onAddIndent({
      unitName: unitName.trim(),
      category,
      quantity: Number(quantity),
      priority
    });

    setUnitName('');
    setQuantity(500);
    setShowModal(false);
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-[#1b4332] border-emerald-200';
      case 'DISPATCHED':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'DELIVERED':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-[#2d6a4f]" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#f8faf9] border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-[#2d6a4f]"
          >
            <option value="ALL">ALL CATEGORIES</option>
            <option value="AMMUNITION">AMMUNITION</option>
            <option value="RATIONS">RATIONS</option>
            <option value="FOL">FOL (FUEL / OIL)</option>
            <option value="MEDICAL">MEDICAL</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#f8faf9] border border-gray-200 text-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-[#2d6a4f]"
          >
            <option value="ALL">ALL PRIORITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-tactical font-bold text-sm tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Plus size={16} />
          <span>RAISE TACTICAL INDENT</span>
        </button>
      </div>

      {/* Indents Table */}
      <div className="bg-white border border-emerald-100/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#edf4ef] text-[#1b4332] font-tactical text-sm tracking-wider border-b border-emerald-100">
              <tr>
                <th className="py-3 px-4 font-bold">UNIT / DEPOT</th>
                <th className="py-3 px-4 font-bold">CATEGORY</th>
                <th className="py-3 px-4 font-bold">QUANTITY</th>
                <th className="py-3 px-4 font-bold">PRIORITY</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 font-bold text-right">ECHELON ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIndents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    No requisitions recorded.
                  </td>
                </tr>
              ) : (
                filteredIndents.map((item) => (
                  <tr key={item._id || item.unitName} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {item.unitName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1b4332]">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-900 text-sm">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => onUpdateStatus(item._id, 'APPROVED')}
                          className="px-3 py-1 rounded-lg bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-tactical font-bold text-xs shadow-xs"
                        >
                          APPROVE
                        </button>
                      )}
                      {item.status === 'APPROVED' && (
                        <button
                          onClick={() => onUpdateStatus(item._id, 'DISPATCHED')}
                          className="px-3 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-tactical font-bold text-xs shadow-xs"
                        >
                          DISPATCH
                        </button>
                      )}
                      {item.status === 'DISPATCHED' && (
                        <button
                          onClick={() => onUpdateStatus(item._id, 'DELIVERED')}
                          className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-tactical font-bold text-xs shadow-xs"
                        >
                          DELIVER
                        </button>
                      )}
                      {item.status === 'DELIVERED' && (
                        <span className="text-xs font-mono text-[#2d6a4f] font-semibold">
                          COMPLETED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-emerald-200 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-tactical font-bold text-xl text-gray-900 mb-4 border-b border-gray-100 pb-2">
              RAISE TACTICAL INDENT (REQUISITION)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-tactical font-bold uppercase mb-1">
                  Forward Unit / Post Name
                </label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Forward Post 42 (Kargil)"
                  required
                  className="w-full bg-[#f8faf9] border border-gray-300 focus:border-[#2d6a4f] rounded-lg p-2.5 text-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-tactical font-bold uppercase mb-1">
                  Supply Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#f8faf9] border border-gray-300 focus:border-[#2d6a4f] rounded-lg p-2.5 text-gray-900 outline-none"
                >
                  <option value="AMMUNITION">AMMUNITION (Small Arms / Artillery)</option>
                  <option value="RATIONS">RATIONS (High-Altitude Pack)</option>
                  <option value="FOL">FOL (Sub-Zero Fuel & Lubricants)</option>
                  <option value="MEDICAL">MEDICAL (High Altitude Trauma)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-tactical font-bold uppercase mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="w-full bg-[#f8faf9] border border-gray-300 focus:border-[#2d6a4f] rounded-lg p-2.5 text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-tactical font-bold uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#f8faf9] border border-gray-300 focus:border-[#2d6a4f] rounded-lg p-2.5 text-gray-900 outline-none"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate)</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-tactical font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-tactical font-bold shadow-xs"
                >
                  SUBMIT REQUISITION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
