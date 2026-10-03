import React, { useState } from 'react';
import { Plus, Filter, FileText, CheckCircle2, Truck, PackageCheck } from 'lucide-react';

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
        return 'bg-red-100 text-red-700 border-red-300 animate-pulse';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DISPATCHED':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls - White Surface */}
      <div className="bg-white border border-[#c8ddcf] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs hud-corner-brackets">
        <div className="flex items-center gap-3">
          <Filter size={15} className="text-[#ff6600]" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded px-3 py-1.5 text-xs font-mono outline-none focus:border-[#ff6600]"
          >
            <option value="ALL">ALL CATEGORIES</option>
            <option value="AMMUNITION">AMMUNITION (CLASS V)</option>
            <option value="RATIONS">RATIONS (CLASS I)</option>
            <option value="FOL">FOL (FUEL / OIL - CLASS III)</option>
            <option value="MEDICAL">MEDICAL (CLASS VIII)</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded px-3 py-1.5 text-xs font-mono outline-none focus:border-[#ff6600]"
          >
            <option value="ALL">ALL PRIORITIES</option>
            <option value="CRITICAL">CRITICAL (DEFCON 1)</option>
            <option value="HIGH">HIGH PRIORITY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#ff6600] hover:bg-[#e65100] text-white font-stencil font-bold text-xs tracking-wider px-4 py-2 rounded flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>RAISE TACTICAL INDENT</span>
        </button>
      </div>

      {/* Indents Table - Crisp White Surface */}
      <div className="bg-white border border-[#c8ddcf] rounded-lg overflow-hidden shadow-xs hud-corner-brackets">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f0f5f1] text-[#1c3824] font-stencil text-xs tracking-wider border-b border-[#c8ddcf]">
              <tr>
                <th className="py-3 px-4 font-bold">FORWARD FORMATION / POST</th>
                <th className="py-3 px-4 font-bold">SUPPLY CLASS</th>
                <th className="py-3 px-4 font-bold">QUANTITY</th>
                <th className="py-3 px-4 font-bold">TACTICAL PRIORITY</th>
                <th className="py-3 px-4 font-bold">STATUS</th>
                <th className="py-3 px-4 font-bold text-right">ECHELON ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredIndents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 font-mono">
                    NO REQUISITIONS LOGGED FOR CURRENT FILTERS
                  </td>
                </tr>
              ) : (
                filteredIndents.map((item) => (
                  <tr key={item._id || item.unitName} className="hover:bg-[#f7faf8] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900 font-sans">
                      {item.unitName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#997746]">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-800 text-sm font-semibold">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => onUpdateStatus(item._id, 'APPROVED')}
                          className="px-3 py-1 rounded bg-[#1c3824] hover:bg-[#284f33] text-white font-stencil font-bold text-xs cursor-pointer shadow-xs"
                        >
                          APPROVE
                        </button>
                      )}
                      {item.status === 'APPROVED' && (
                        <button
                          onClick={() => onUpdateStatus(item._id, 'DISPATCHED')}
                          className="px-3 py-1 rounded bg-sky-700 hover:bg-sky-800 text-white font-stencil font-bold text-xs cursor-pointer shadow-xs"
                        >
                          DISPATCH
                        </button>
                      )}
                      {item.status === 'DISPATCHED' && (
                        <button
                          onClick={() => onUpdateStatus(item._id, 'DELIVERED')}
                          className="px-3 py-1 rounded bg-[#ff6600] hover:bg-[#e65100] text-white shadow-xs font-stencil font-bold text-xs cursor-pointer"
                        >
                          DELIVER
                        </button>
                      )}
                      {item.status === 'DELIVERED' && (
                        <span className="text-xs font-mono text-emerald-700 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 size={13} /> COMPLETED
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

      {/* Modal Dialog - Tactical Dispatch Console (White Modal) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#c8ddcf] rounded-lg p-6 shadow-2xl relative hud-corner-brackets">
            <h3 className="font-stencil font-bold text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
              <FileText className="text-[#ff6600]" size={18} />
              <span>RAISE TACTICAL REQUISITION (INDENT)</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                  Forward Unit / Sector Post
                </label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. 14 Corps / Siachen Glacier Camp 3"
                  className="w-full bg-[#f8faf8] border border-[#c8ddcf] focus:border-[#ff6600] text-gray-900 rounded p-2.5 text-xs font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                    Supply Class
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#f8faf8] border border-[#c8ddcf] focus:border-[#ff6600] text-gray-900 rounded p-2.5 text-xs font-mono outline-none"
                  >
                    <option value="AMMUNITION">AMMUNITION (CLASS V)</option>
                    <option value="RATIONS">RATIONS (CLASS I)</option>
                    <option value="FOL">FOL (FUEL / OIL)</option>
                    <option value="MEDICAL">MEDICAL (CLASS VIII)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[#f8faf8] border border-[#c8ddcf] focus:border-[#ff6600] text-gray-900 rounded p-2.5 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                  Priority Echelon
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#f8faf8] border border-[#c8ddcf] focus:border-[#ff6600] text-gray-900 rounded p-2.5 text-xs font-mono outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Drop)</option>
                  <option value="HIGH">HIGH (Within 24 Hours)</option>
                  <option value="MEDIUM">MEDIUM (Standard Turnaround)</option>
                  <option value="LOW">LOW (Scheduled Routine)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-stencil font-bold text-xs tracking-wider border border-gray-300 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#ff6600] hover:bg-[#e65100] text-white font-stencil font-bold text-xs tracking-wider shadow-xs cursor-pointer"
                >
                  SUBMIT INDENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
