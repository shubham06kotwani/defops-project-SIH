const Indent = require('../models/Indent');
const tacticalStore = require('../services/tacticalStore');

const HIGHER_AUTHORITY_ROLES = ['COMMANDER', 'ADMIN', 'DEPOT_MANAGER', 'HIGHER_AUTHORITY'];

exports.createIndent = async (req, res) => {
  const { unitName, category, quantity, priority, requestedBy } = req.body;

  const requester = requestedBy || {
    serviceNumber: req.user?.serviceNumber || 'OR-88412',
    name: req.user?.name || 'Havildar Rajesh Kumar',
    rank: req.user?.rank || 'HAVILDAR',
    role: req.user?.role || 'OPERATOR'
  };

  const payload = {
    unitName,
    category,
    quantity,
    priority,
    status: 'PENDING',
    requestedBy: requester,
    approvedBy: null,
    rejectionReason: null
  };

  try {
    const newIndent = await Indent.create(payload);
    tacticalStore.addIndent(newIndent);
    return res.status(201).json(newIndent);
  } catch (err) {
    // MongoDB offline / zero-network fallback
    const inMemIndent = tacticalStore.addIndent(payload);
    return res.status(201).json(inMemIndent);
  }
};

exports.getAllIndents = async (req, res) => {
  try {
    const indents = await Indent.find().sort({ createdAt: -1 });
    if (indents && indents.length > 0) {
      return res.json(indents);
    }
  } catch (err) {
    // Fallback mode
  }

  res.json(tacticalStore.getIndents());
};

exports.updateIndentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, remarks, user: requestUser } = req.body;

  // Identify acting user (from session/JWT or request body)
  const actingUser = requestUser || req.user || {
    serviceNumber: 'IC-00101',
    name: 'Brigadier Amitav Sen',
    rank: 'BRIGADIER',
    role: 'COMMANDER'
  };

  // Find target indent
  let indent = null;
  try {
    indent = await Indent.findById(id);
  } catch (e) {}

  if (!indent) {
    indent = tacticalStore.getIndents().find(i => i._id === id);
  }

  if (!indent) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Requisition not found' });
  }

  // BUSINESS LOGIC: MILITARY SEPARATION OF DUTIES & RBAC
  if (status === 'APPROVED' || status === 'REJECTED') {
    // 1. Role verification: Only Higher Authority can approve/reject
    const isHigherAuthority = HIGHER_AUTHORITY_ROLES.includes(actingUser.role?.toUpperCase());
    if (!isHigherAuthority) {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: `Command Authority Violation: Requisition approval is restricted to Higher Command Authority (Brigade HQ / Division Commander / Depot Manager). Current user role: [${actingUser.role}].`
      });
    }

    // 2. Anti-Self-Approval Protocol: The requester CANNOT approve their own acquisition!
    const requesterNumber = indent.requestedBy?.serviceNumber?.trim()?.toUpperCase();
    const approverNumber = actingUser.serviceNumber?.trim()?.toUpperCase();

    if (requesterNumber && approverNumber && requesterNumber === approverNumber) {
      return res.status(403).json({
        error: 'SELF_APPROVAL_PROHIBITED',
        message: `Conflict of Interest: Requester (${indent.requestedBy.name}) cannot self-approve their own tactical requisition. Military Protocol mandates independent Higher Authority sign-off.`
      });
    }
  }

  // If dispatching, ensure indent was approved first
  if (status === 'DISPATCHED' && indent.status !== 'APPROVED') {
    return res.status(400).json({
      error: 'INVALID_SEQUENCE',
      message: 'Requisition must be approved by Higher Authority before convoy dispatch can be authorized.'
    });
  }

  const approverData = {
    serviceNumber: actingUser.serviceNumber,
    name: actingUser.name,
    rank: actingUser.rank,
    role: actingUser.role,
    timestamp: new Date().toISOString(),
    remarks: remarks || (status === 'APPROVED' ? 'Cleared by Higher Command Authority.' : 'Reviewed.')
  };

  try {
    // Try updating Mongo
    const updateFields = {
      status,
      updatedAt: new Date()
    };
    if (status === 'APPROVED') {
      updateFields.approvedBy = approverData;
      updateFields.rejectionReason = null;
    } else if (status === 'REJECTED') {
      updateFields.rejectionReason = remarks || 'Denied by Higher Command.';
      updateFields.approvedBy = approverData;
    }

    const updated = await Indent.findByIdAndUpdate(id, updateFields, { new: true });
    if (updated) {
      tacticalStore.updateIndentStatus(id, status, approverData, remarks);
      return res.json(updated);
    }
  } catch (err) {}

  // Fallback to in-memory store
  const updatedInMem = tacticalStore.updateIndentStatus(id, status, approverData, remarks);
  if (updatedInMem) {
    return res.json(updatedInMem);
  }

  return res.status(500).json({ error: 'FAILED', message: 'Failed to update requisition status' });
};