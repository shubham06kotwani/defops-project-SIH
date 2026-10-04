import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  AlertTriangle, 
  UserCheck, 
  X, 
  Check, 
  Ban, 
  CornerDownRight, 
  Shield, 
  Award,
  ChevronRight
} from 'lucide-react';

const HIGHER_AUTHORITY_ROLES = ['COMMANDER', 'ADMIN', 'DEPOT_MANAGER', 'HIGHER_AUTHORITY'];

// Default simulated military profiles for seamless chain-of-command evaluation
const MILITARY_ECHELONS = [
  {
    serviceNumber: 'IC-00101',
    name: 'Brigadier Amitav Sen',
    rank: 'BRIGADIER',
    role: 'COMMANDER',
    unit: 'HQ 14 Corps / Logistics Directorate',
    icon: '🎖️',
    isHigherAuthority: true
  },
  {
    serviceNumber: 'IC-10293',
    name: 'Major Vikram Singh',
    rank: 'MAJOR',
    role: 'OFFICER',
    unit: 'Forward Post 42 (Kargil / Siachen Sector)',
    icon: '🪖',
    isHigherAuthority: false
  },
  {
    serviceNumber: 'OR-88412',
    name: 'Havildar Rajesh Kumar',
    rank: 'HAVILDAR',
    role: 'OPERATOR',
    unit: 'Forward Supply Depot NCO',
    icon: '📦',
    isHigherAuthority: false
  }
];

export default function Requisitions({ indents, onAddIndent, onUpdateStatus, user, onSwitchUser }) {
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Form State
  const [unitName, setUnitName] = useState('');
  const [category, setCategory] = useState('AMMUNITION');
  const [quantity, setQuantity] = useState(500);
  const [priority, setPriority] = useState('HIGH');

  // Rejection Modal State
  const [rejectingIndent, setRejectingIndent] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');

  // Status feedback toast/notice
  const [protocolAlert, setProtocolAlert] = useState(null);

  // Active user resolution (falls back to Major Vikram Singh if not authenticated)
  const activeUser = user || {
    serviceNumber: 'IC-10293',
    name: 'Major Vikram Singh',
    rank: 'MAJOR',
    role: 'OFFICER',
    unit: 'Forward Post 42'
  };

  const isCurrentHigherAuthority = HIGHER_AUTHORITY_ROLES.includes(activeUser.role?.toUpperCase());

  const filteredIndents = indents.filter(item => {
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!unitName.trim() || !quantity) return;

    onAddIndent({
      unitName: unitName.trim(),
      category,
      quantity: Number(quantity),
      priority,
      status: 'PENDING',
      requestedBy: {
        serviceNumber: activeUser.serviceNumber,
        name: activeUser.name,
        rank: activeUser.rank,
        role: activeUser.role
      }
    });

    setProtocolAlert({
      type: 'INFO',
      message: `Requisition raised by ${activeUser.rank} ${activeUser.name}. Status: PENDING HIGHER COMMAND APPROVAL. Self-approval is locked.`
    });

    setUnitName('');
    setQuantity(500);
    setShowModal(false);
  };

  // Handle Approval Click with Role & Anti-Self-Approval Checks
  const handleApproveClick = async (item) => {
    // 1. Separation of duties check
    const isRequester = item.requestedBy?.serviceNumber?.trim()?.toUpperCase() === activeUser.serviceNumber?.trim()?.toUpperCase();
    if (isRequester) {
      setProtocolAlert({
        type: 'ERROR',
        message: `PROTOCOL VIOLATION: Requester (${item.requestedBy?.name}) cannot approve their own requisition. Independent Higher Authority sign-off is required by MoD Military Logistics Manual.`
      });
      return;
    }

    // 2. Higher Authority role check
    if (!isCurrentHigherAuthority) {
      setProtocolAlert({
        type: 'ERROR',
        message: `AUTHORIZATION DENIED: Current echelon [${activeUser.role}] lacks Higher Command approval clearance. Switch to Brigadier / Commander echelon to authorize.`
      });
      return;
    }

    try {
      await onUpdateStatus(item._id, 'APPROVED', `Authorized by ${activeUser.rank} ${activeUser.name} (${activeUser.role})`);
      setProtocolAlert({
        type: 'SUCCESS',
        message: `TACTICAL RELEASE GRANTED: Requisition #${item._id} authorized by ${activeUser.rank} ${activeUser.name}. Convoy dispatch unlocked.`
      });
    } catch (err) {
      setProtocolAlert({
        type: 'ERROR',
        message: err.message || 'Approval rejected by military security policy.'
      });
    }
  };

  // Open Rejection Dialog
  const handleOpenReject = (item) => {
    const isRequester = item.requestedBy?.serviceNumber?.trim()?.toUpperCase() === activeUser.serviceNumber?.trim()?.toUpperCase();
    if (isRequester) {
      setProtocolAlert({
        type: 'ERROR',
        message: `PROTOCOL VIOLATION: Self-adjudication prohibited. Requester cannot reject or alter their own pending indent.`
      });
      return;
    }

    if (!isCurrentHigherAuthority) {
      setProtocolAlert({
        type: 'ERROR',
        message: `AUTHORIZATION DENIED: Only Higher Command Authority can formally reject an indent.`
      });
      return;
    }

    setRejectingIndent(item);
    setRejectionRemarks('Stock reserve priority reallocated to active offensive theatre.');
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectingIndent) return;

    try {
      await onUpdateStatus(rejectingIndent._id, 'REJECTED', rejectionRemarks);
      setProtocolAlert({
        type: 'WARNING',
        message: `REQUISITION DENIED: Indent #${rejectingIndent._id} rejected by ${activeUser.rank} ${activeUser.name}. Reason: ${rejectionRemarks}`
      });
    } catch (err) {
      setProtocolAlert({
        type: 'ERROR',
        message: err.message || 'Rejection failed.'
      });
    } finally {
      setRejectingIndent(null);
      setRejectionRemarks('');
    }
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
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
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
      {/* 1. MILITARY CHAIN-OF-COMMAND & SEPARATION OF DUTIES HUD */}
      <div className="bg-white border border-[#c8ddcf] rounded-lg p-4 shadow-xs hud-corner-brackets">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-[#1c3824]" size={20} />
            <div>
              <h2 className="font-stencil font-bold text-base text-gray-900 tracking-wider flex items-center gap-2">
                <span>MILITARY REQUISITION (INDENT) ASSURANCE CONSOLE</span>
              </h2>
              <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                Indian Army Echelon-of-Supply Protocol &bull; Separation of Duties Strict Enforcement
              </p>
            </div>
          </div>

          {/* Active Echelon Identity Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">ACTIVE ECHELON:</span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold shadow-2xs ${
              isCurrentHigherAuthority 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <span>{isCurrentHigherAuthority ? '🎖️' : '🪖'}</span>
              <div>
                <span className="block font-stencil tracking-wider text-xs">{activeUser.name}</span>
                <span className="text-[10px] font-normal text-gray-600">
                  {activeUser.rank} &bull; {activeUser.role} {isCurrentHigherAuthority ? '(HIGHER AUTHORITY)' : '(FORWARD POST)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chain-of-Command Protocol Banner & Quick Role Switcher */}
        <div className="mt-3 pt-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Protocol Rules Explanation */}
          <div className="md:col-span-2 bg-[#f0f6f2] border border-[#c2dcd0] rounded-lg p-3 text-[11px] font-mono text-gray-700 space-y-1.5">
            <div className="font-stencil font-bold text-xs text-[#1c3824] uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={12} className="text-[#ff6600]" />
              <span>MoD Mandatory Protocol Rules:</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-700 font-bold">1. FORWARD RAISING:</span>
              <span>Forward units/operators raise requisitions. Indents enter <strong className="text-amber-700">PENDING</strong> status.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-700 font-bold">2. ANTI-SELF-APPROVAL:</span>
              <span>The officer/operator who raises a requisition is <strong className="text-red-700">STRICTLY PROHIBITED</strong> from approving it.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#1c3824] font-bold">3. HIGHER COMMAND SIGN-OFF:</span>
              <span>Only designated <strong className="text-[#1c3824]">Higher Authority (Commander / Brigadier / Depot Head)</strong> can formally release supplies.</span>
            </div>
          </div>

          {/* Quick Interactive Echelon Switcher for Evaluation */}
          <div className="bg-[#f8faf8] border border-[#c8ddcf] rounded-lg p-3 text-xs font-mono">
            <div className="text-[10px] text-gray-500 font-stencil font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>TEST CHAIN OF COMMAND:</span>
              <span className="text-[#ff6600]">SWITCH ECHELON</span>
            </div>
            <div className="space-y-1.5">
              {MILITARY_ECHELONS.map(echelon => {
                const isActive = activeUser.serviceNumber === echelon.serviceNumber;
                return (
                  <button
                    key={echelon.serviceNumber}
                    type="button"
                    onClick={() => onSwitchUser && onSwitchUser(echelon)}
                    className={`w-full text-left p-1.5 rounded flex items-center justify-between text-[11px] transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-[#1c3824] text-white border-[#1c3824] font-bold shadow-xs' 
                        : 'bg-white text-gray-800 hover:bg-[#eaf1ec] border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{echelon.icon}</span>
                      <span className="truncate">{echelon.name}</span>
                    </div>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-stencil ${
                      isActive ? 'bg-[#ff6600] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {echelon.isHigherAuthority ? 'COMMANDER' : 'REQUESTER'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Alert Banner */}
        {protocolAlert && (
          <div className={`mt-3 p-3 rounded-lg border text-xs font-mono flex items-start justify-between gap-3 animate-fadeIn ${
            protocolAlert.type === 'ERROR' 
              ? 'bg-red-50 border-red-300 text-red-900' 
              : protocolAlert.type === 'WARNING'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-start gap-2">
              {protocolAlert.type === 'ERROR' ? <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" /> : <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
              <div>
                <span className="font-stencil font-bold tracking-wider mr-1">
                  [{protocolAlert.type}]:
                </span>
                <span>{protocolAlert.message}</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setProtocolAlert(null)}
              className="text-gray-400 hover:text-gray-700 cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Filters & Raise Indent Action Bar */}
      <div className="bg-white border border-[#c8ddcf] rounded-lg p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs hud-corner-brackets">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs flex-1 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#ff6600]"
          >
            <option value="ALL">ALL SUPPLY CLASSES</option>
            <option value="AMMUNITION">AMMUNITION (CLASS V)</option>
            <option value="RATIONS">RATIONS (CLASS I)</option>
            <option value="FOL">FOL (FUEL / OIL - CLASS III)</option>
            <option value="MEDICAL">MEDICAL (CLASS VIII)</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#ff6600]"
          >
            <option value="ALL">ALL PRIORITIES</option>
            <option value="CRITICAL">CRITICAL (DEFCON 1)</option>
            <option value="HIGH">HIGH PRIORITY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#f8faf8] border border-[#c8ddcf] text-gray-800 rounded px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[#ff6600]"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="PENDING">PENDING APPROVAL</option>
            <option value="APPROVED">APPROVED (HIGHER COMMAND)</option>
            <option value="REJECTED">REJECTED</option>
            <option value="DISPATCHED">DISPATCHED (IN TRANSIT)</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto bg-[#ff6600] hover:bg-[#e65100] text-white font-stencil font-bold text-xs tracking-wider px-4 py-2 rounded flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>RAISE TACTICAL INDENT</span>
        </button>
      </div>

      {/* 3. Requisitions - Desktop Table & Mobile Tactical Cards */}
      <div className="bg-white border border-[#c8ddcf] rounded-lg overflow-hidden shadow-xs hud-corner-brackets">
        
        {/* Desktop View: Full Military 6-Column Tabular View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f0f5f1] text-[#1c3824] font-stencil text-xs tracking-wider border-b border-[#c8ddcf]">
              <tr>
                <th className="py-3 px-3.5 font-bold">INDENT ID</th>
                <th className="py-3 px-3.5 font-bold">FORWARD FORMATION / POST</th>
                <th className="py-3 px-3.5 font-bold">SUPPLY &amp; QTY</th>
                <th className="py-3 px-3.5 font-bold">REQUESTED BY (ORIGINATOR)</th>
                <th className="py-3 px-3.5 font-bold">STATUS &amp; APPROVAL AUDIT</th>
                <th className="py-3 px-3.5 font-bold text-right">COMMAND ECHELON ACTION</th>
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
                filteredIndents.map((item) => {
                  const isRequester = item.requestedBy?.serviceNumber?.trim()?.toUpperCase() === activeUser.serviceNumber?.trim()?.toUpperCase();
                  const canApprove = isCurrentHigherAuthority && !isRequester;

                  return (
                    <tr key={item._id || item.unitName} className="hover:bg-[#f7faf8] transition-colors">
                      {/* Indent ID */}
                      <td className="py-3.5 px-3.5 font-mono font-bold text-gray-900 text-xs">
                        <div>{item._id || 'IND-XXXX'}</div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border mt-1 ${getPriorityBadge(item.priority)}`}>
                          {item.priority}
                        </span>
                      </td>

                      {/* Forward Formation */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-gray-900 font-sans">{item.unitName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {new Date(item.createdAt || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Supply & Qty */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-mono font-bold text-[#997746]">{item.category}</div>
                        <div className="text-gray-800 text-sm font-semibold font-mono">
                          {item.quantity?.toLocaleString()} <small className="text-[10px] text-gray-500">units</small>
                        </div>
                      </td>

                      {/* Originator (Requested By) */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-mono font-bold text-gray-800 flex items-center gap-1">
                          <span>👤</span>
                          <span>{item.requestedBy?.name || 'Forward Unit Officer'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{item.requestedBy?.serviceNumber || 'MIL-SVC'}</span>
                          <span>&bull;</span>
                          <span className="text-[#1c3824] font-bold">[{item.requestedBy?.role || 'OPERATOR'}]</span>
                        </div>
                        {isRequester && (
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-mono font-bold">
                            YOU ARE ORIGINATOR
                          </span>
                        )}
                      </td>

                      {/* Status & Approval Audit */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Audit Details */}
                        {item.status === 'APPROVED' && item.approvedBy && (
                          <div className="mt-1 text-[10px] font-mono text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                            <div className="font-bold flex items-center gap-1">
                              <span>🎖️ Approved by:</span>
                              <span>{item.approvedBy.name} ({item.approvedBy.rank})</span>
                            </div>
                            {item.approvedBy.remarks && (
                              <div className="text-gray-600 italic text-[9px] truncate max-w-[200px]" title={item.approvedBy.remarks}>
                                "{item.approvedBy.remarks}"
                              </div>
                            )}
                          </div>
                        )}

                        {item.status === 'REJECTED' && (
                          <div className="mt-1 text-[10px] font-mono text-red-800 bg-red-50 p-1.5 rounded border border-red-200">
                            <div className="font-bold flex items-center gap-1">
                              <span>❌ Denied by Command</span>
                            </div>
                            {item.rejectionReason && (
                              <div className="text-red-700 text-[9px] truncate max-w-[200px]" title={item.rejectionReason}>
                                "{item.rejectionReason}"
                              </div>
                            )}
                          </div>
                        )}

                        {item.status === 'PENDING' && (
                          <div className="mt-1 text-[10px] font-mono text-amber-800 flex items-center gap-1">
                            <span>⏳</span>
                            <span>Awaiting Higher Command</span>
                          </div>
                        )}
                      </td>

                      {/* Echelon Action Column */}
                      <td className="py-3.5 px-3.5 text-right space-y-1">
                        {item.status === 'PENDING' && (
                          <>
                            {isRequester ? (
                              <div className="inline-flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold" title="You requested this indent. Separation of duties prevents self-approval.">
                                  <Lock size={11} className="text-amber-700" />
                                  <span>SELF-APPROVAL BLOCKED</span>
                                </span>
                                <span className="text-[9px] text-gray-500 font-mono mt-0.5">
                                  Requires Independent Commander
                                </span>
                              </div>
                            ) : !isCurrentHigherAuthority ? (
                              <div className="inline-flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 border border-gray-300 text-gray-600 text-[10px] font-mono font-bold" title="Only Commander Echelon can approve requisitions.">
                                  <ShieldAlert size={11} className="text-gray-500" />
                                  <span>HIGHER COMMAND REQUIRED</span>
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono mt-0.5">
                                  Switch to Brigadier Echelon
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveClick(item)}
                                  className="px-3 py-1 rounded bg-[#1c3824] hover:bg-[#284f33] text-white font-stencil font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1 transition-all"
                                  title="Formally approve and authorize supply allocation"
                                >
                                  <ShieldCheck size={12} />
                                  <span>APPROVE</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(item)}
                                  className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-stencil font-bold text-xs cursor-pointer transition-all"
                                  title="Reject requisition with command rationale"
                                >
                                  <Ban size={12} />
                                  <span>REJECT</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {item.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(item._id, 'DISPATCHED')}
                            className="px-3 py-1 rounded bg-sky-700 hover:bg-sky-800 text-white font-stencil font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1 ml-auto"
                            title="Release supply convoy into tactical transit"
                          >
                            <Truck size={12} />
                            <span>DISPATCH CONVOY</span>
                          </button>
                        )}

                        {item.status === 'DISPATCHED' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(item._id, 'DELIVERED')}
                            className="px-3 py-1 rounded bg-[#ff6600] hover:bg-[#e65100] text-white shadow-xs font-stencil font-bold text-xs cursor-pointer flex items-center gap-1 ml-auto"
                            title="Confirm handover at destination post"
                          >
                            <CheckCircle2 size={12} />
                            <span>CONFIRM DELIVERY</span>
                          </button>
                        )}

                        {item.status === 'DELIVERED' && (
                          <span className="text-xs font-mono text-emerald-700 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 size={13} /> COMPLETED &bull; SECURED
                          </span>
                        )}

                        {item.status === 'REJECTED' && (
                          <span className="text-xs font-mono text-red-700 font-bold flex items-center justify-end gap-1">
                            <X size={13} /> REQUISITION CLOSED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High-Density Tactical Requisition Cards (< 768px) */}
        <div className="block md:hidden divide-y divide-gray-200">
          {filteredIndents.length === 0 ? (
            <div className="py-8 text-center text-gray-500 font-mono text-xs">
              NO REQUISITIONS LOGGED FOR CURRENT FILTERS
            </div>
          ) : (
            filteredIndents.map((item) => {
              const isRequester = item.requestedBy?.serviceNumber?.trim()?.toUpperCase() === activeUser.serviceNumber?.trim()?.toUpperCase();

              return (
                <div key={item._id || item.unitName} className="p-3.5 space-y-2.5 bg-white">
                  {/* Top: ID, Priority, Date */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">{item._id || 'IND-XXXX'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(item.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Formation Post & Supply info */}
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900 text-xs font-sans">{item.unitName}</div>
                    <div className="flex items-center justify-between text-xs font-mono bg-[#f7faf8] p-2 rounded border border-[#d6e5db]">
                      <span className="font-bold text-[#997746]">
                        {item.category}
                      </span>
                      <span className="font-bold text-gray-900">
                        {item.quantity?.toLocaleString()} <small className="text-gray-500 font-normal">units</small>
                      </span>
                    </div>
                  </div>

                  {/* Requester & Status Details */}
                  <div className="text-[11px] font-mono space-y-1 text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Originator:</span>
                      <span className="font-bold text-gray-900">
                        {item.requestedBy?.name || 'Officer'} [{item.requestedBy?.role || 'OPERATOR'}]
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    {item.status === 'APPROVED' && item.approvedBy && (
                      <div className="mt-1 text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                        🎖️ Approved by: <strong>{item.approvedBy.name} ({item.approvedBy.rank})</strong>
                      </div>
                    )}

                    {item.status === 'REJECTED' && item.rejectionReason && (
                      <div className="mt-1 text-[10px] text-red-800 bg-red-50 p-2 rounded border border-red-200">
                        ❌ Reason: "{item.rejectionReason}"
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Mobile */}
                  <div className="pt-1">
                    {item.status === 'PENDING' && (
                      <>
                        {isRequester ? (
                          <div className="w-full text-center py-2 px-2.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5">
                            <Lock size={12} className="text-amber-700 shrink-0" />
                            <span>SELF-APPROVAL BLOCKED (CMD REQ.)</span>
                          </div>
                        ) : !isCurrentHigherAuthority ? (
                          <div className="w-full text-center py-2 px-2.5 rounded bg-gray-100 border border-gray-300 text-gray-600 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5">
                            <ShieldAlert size={12} className="text-gray-500 shrink-0" />
                            <span>HIGHER COMMAND REQUIRED</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveClick(item)}
                              className="w-full py-2 rounded bg-[#1c3824] hover:bg-[#284f33] text-white font-stencil font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                            >
                              <ShieldCheck size={13} />
                              <span>APPROVE</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReject(item)}
                              className="w-full py-2 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-stencil font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <Ban size={13} />
                              <span>REJECT</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {item.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item._id, 'DISPATCHED')}
                        className="w-full py-2 rounded bg-sky-700 hover:bg-sky-800 text-white font-stencil font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Truck size={13} />
                        <span>DISPATCH CONVOY</span>
                      </button>
                    )}

                    {item.status === 'DISPATCHED' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item._id, 'DELIVERED')}
                        className="w-full py-2 rounded bg-[#ff6600] hover:bg-[#e65100] text-white font-stencil font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span>CONFIRM DELIVERY</span>
                      </button>
                    )}

                    {item.status === 'DELIVERED' && (
                      <div className="text-center py-1 text-xs font-mono text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 size={13} /> DELIVERED &bull; COMPLETED
                      </div>
                    )}

                    {item.status === 'REJECTED' && (
                      <div className="text-center py-1 text-xs font-mono text-red-700 font-bold flex items-center justify-center gap-1">
                        <X size={13} /> REQUISITION CLOSED
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* 4. Modal Dialog - Tactical Requisition Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-[#c8ddcf] rounded-lg p-4 sm:p-6 shadow-2xl relative hud-corner-brackets">
            <h3 className="font-stencil font-bold text-base sm:text-lg text-gray-900 mb-1 flex items-center gap-2">
              <FileText className="text-[#ff6600]" size={18} />
              <span>RAISE TACTICAL REQUISITION (INDENT)</span>
            </h3>
            <p className="text-xs text-gray-500 font-mono mb-4 pb-2 border-b border-gray-200">
              Originating Officer: <strong className="text-[#1c3824]">{activeUser.rank} {activeUser.name}</strong> ({activeUser.serviceNumber})
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                  Forward Unit / Sector Post:
                </label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Siachen Base Camp / 121 Inf Bde Kargil"
                  className="w-full bg-[#f8faf8] border border-[#c8ddcf] focus:border-[#ff6600] text-gray-900 rounded p-2.5 text-xs font-mono outline-none shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1c3824] font-stencil font-bold uppercase tracking-wider mb-1">
                    Supply Class:
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
                    Quantity:
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
                  Priority Echelon:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#f8faf8] border border-[#c8ddcf] focus:border-[#ff6600] text-gray-900 rounded p-2.5 text-xs font-mono outline-none"
                >
                  <option value="CRITICAL">CRITICAL (DEFCON 1 - Immediate)</option>
                  <option value="HIGH">HIGH (Within 24 Hours)</option>
                  <option value="MEDIUM">MEDIUM (Standard Cycle)</option>
                  <option value="LOW">LOW (Routine Scheduled)</option>
                </select>
              </div>

              {/* Protocol Notice */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                <span className="font-bold">⚠️ Separation of Duties Notice:</span> Once submitted, this indent will be in <strong>PENDING</strong> status. As the originator ({activeUser.name}), you will <strong>NOT</strong> be permitted to self-approve it. Higher Authority authorization is required.
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-stencil font-bold text-xs tracking-wider border border-gray-300 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#ff6600] hover:bg-[#e65100] text-white font-stencil font-bold text-xs tracking-wider shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText size={13} />
                  <span>SUBMIT REQUISITION</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Dialog - Commander Rejection Rationale */}
      {rejectingIndent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-red-300 rounded-lg p-4 sm:p-6 shadow-2xl relative hud-corner-brackets">
            <h3 className="font-stencil font-bold text-base sm:text-lg text-red-900 mb-1 flex items-center gap-2">
              <Ban className="text-red-600" size={18} />
              <span>COMMAND REJECTION RATIONALE</span>
            </h3>
            <p className="text-xs text-gray-600 font-mono mb-3 pb-2 border-b border-gray-200">
              Adjudicating Indent #{rejectingIndent._id} ({rejectingIndent.unitName})
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-gray-700 font-bold uppercase mb-1">
                  Specify Operational Rejection Reason:
                </label>
                <textarea
                  rows={3}
                  value={rejectionRemarks}
                  onChange={(e) => setRejectionRemarks(e.target.value)}
                  className="w-full bg-[#fcfcfc] border border-gray-300 focus:border-red-500 text-gray-900 rounded p-2 text-xs outline-none"
                  placeholder="e.g. Forward stock quota exhausted; redirected to critical Northern offensive."
                ></textarea>
              </div>

              {/* Quick Template Reasons */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Quick Selection:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Alpine axis impassable due to blizzard',
                    'Stock reserve allocation exceeded',
                    'Direct requisition through Brigade HQ required'
                  ].map(template => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => setRejectionRemarks(template)}
                      className="px-2 py-0.5 text-[10px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 cursor-pointer"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setRejectingIndent(null)}
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-stencil font-bold text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-stencil font-bold text-xs cursor-pointer shadow-xs"
                >
                  CONFIRM REJECTION
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

