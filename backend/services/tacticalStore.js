/**
 * DEFOPS Zero-Lag Tactical In-Memory Store
 * Ensures 100% operation in Zero Area Networks (air-gapped / offline field deployment).
 * When MongoDB is unreachable, this store handles read/write with sub-millisecond response times.
 */

const DEFAULT_CONTAINERS = [
  {
    containerId: 'CONT-LEH-01',
    baseName: 'Leh Forward Depot',
    location: { type: 'Point', coordinates: [77.5771, 34.1526] },
    sensors: { temperature: 18.2, humidity: 40, battery: 92, tamper: false },
    status: 'NORMAL',
    history: [],
    updatedAt: new Date().toISOString()
  },
  {
    containerId: 'CONT-KARGIL-02',
    baseName: 'Kargil Transit Hub',
    location: { type: 'Point', coordinates: [76.1349, 34.5539] },
    sensors: { temperature: 22.4, humidity: 38, battery: 82, tamper: false },
    status: 'NORMAL',
    history: [],
    updatedAt: new Date().toISOString()
  },
  {
    containerId: 'CONT-SIACHEN-03',
    baseName: 'Siachen Base Camp',
    location: { type: 'Point', coordinates: [77.1700, 35.1970] },
    sensors: { temperature: -14.5, humidity: 62, battery: 85, tamper: false },
    status: 'NORMAL',
    history: [],
    updatedAt: new Date().toISOString()
  },
  {
    containerId: 'CONT-DRAS-04',
    baseName: 'Dras Mountain Post',
    location: { type: 'Point', coordinates: [75.7600, 34.4300] },
    sensors: { temperature: 4.2, humidity: 48, battery: 64, tamper: false },
    status: 'NORMAL',
    history: [],
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_INDENTS = [
  {
    _id: 'IND-901',
    unitName: 'Forward Post 42 (Kargil Axis)',
    category: 'AMMUNITION',
    quantity: 500,
    priority: 'CRITICAL',
    status: 'PENDING',
    requestedBy: {
      serviceNumber: 'OR-88412',
      name: 'Havildar Rajesh Kumar',
      rank: 'HAVILDAR',
      role: 'OPERATOR'
    },
    approvedBy: null,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: 'IND-902',
    unitName: 'Siachen Sector Glacier Depot',
    category: 'RATIONS',
    quantity: 1200,
    priority: 'HIGH',
    status: 'APPROVED',
    requestedBy: {
      serviceNumber: 'IC-10293',
      name: 'Major Vikram Singh',
      rank: 'MAJOR',
      role: 'OFFICER'
    },
    approvedBy: {
      serviceNumber: 'IC-00101',
      name: 'Brigadier Amitav Sen',
      rank: 'BRIGADIER',
      role: 'COMMANDER',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      remarks: 'Operational requirement verified. Winter ration reserve release approved.'
    },
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: 'IND-903',
    unitName: '14 Corps Dras Sector',
    category: 'FOL',
    quantity: 3500,
    priority: 'HIGH',
    status: 'DISPATCHED',
    requestedBy: {
      serviceNumber: 'OR-88412',
      name: 'Havildar Rajesh Kumar',
      rank: 'HAVILDAR',
      role: 'OPERATOR'
    },
    approvedBy: {
      serviceNumber: 'IC-00101',
      name: 'Brigadier Amitav Sen',
      rank: 'BRIGADIER',
      role: 'COMMANDER',
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      remarks: 'Convoy supply clearance granted for Zoji La corridor.'
    },
    createdAt: new Date(Date.now() - 10800000).toISOString()
  }
];

class TacticalStore {
  constructor() {
    this.containers = [...DEFAULT_CONTAINERS];
    this.indents = [...DEFAULT_INDENTS];
  }

  getContainers() {
    return this.containers;
  }

  getContainerById(id) {
    return this.containers.find(c => c.containerId === id) || null;
  }

  updateContainer(containerData) {
    const idx = this.containers.findIndex(c => c.containerId === containerData.containerId);
    if (idx !== -1) {
      this.containers[idx] = {
        ...this.containers[idx],
        ...containerData,
        sensors: {
          ...this.containers[idx].sensors,
          ...containerData.sensors
        },
        updatedAt: new Date().toISOString()
      };
      return this.containers[idx];
    } else {
      const created = {
        ...containerData,
        updatedAt: new Date().toISOString()
      };
      this.containers.push(created);
      return created;
    }
  }

  getIndents() {
    return this.indents;
  }

  addIndent(indentData) {
    const newIndent = {
      _id: 'IND-' + Date.now().toString().slice(-4),
      status: 'PENDING',
      requestedBy: indentData.requestedBy || {
        serviceNumber: 'OR-88412',
        name: 'Havildar Rajesh Kumar',
        rank: 'HAVILDAR',
        role: 'OPERATOR'
      },
      approvedBy: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      ...indentData
    };
    this.indents.unshift(newIndent);
    return newIndent;
  }

  updateIndentStatus(id, newStatus, approver = null, remarks = '') {
    const indent = this.indents.find(i => i._id === id);
    if (!indent) return null;

    indent.status = newStatus;
    indent.updatedAt = new Date().toISOString();

    if (newStatus === 'APPROVED') {
      indent.approvedBy = {
        serviceNumber: approver?.serviceNumber || 'IC-00101',
        name: approver?.name || 'Brigadier Amitav Sen',
        rank: approver?.rank || 'BRIGADIER',
        role: approver?.role || 'COMMANDER',
        timestamp: new Date().toISOString(),
        remarks: remarks || 'Tactical authorization granted by Higher Command.'
      };
      indent.rejectionReason = null;
    } else if (newStatus === 'REJECTED') {
      indent.rejectionReason = remarks || 'Requisition denied by Higher Command Authority.';
      indent.approvedBy = {
        serviceNumber: approver?.serviceNumber || 'IC-00101',
        name: approver?.name || 'Brigadier Amitav Sen',
        rank: approver?.rank || 'BRIGADIER',
        role: approver?.role || 'COMMANDER',
        timestamp: new Date().toISOString(),
        remarks: remarks || 'Rejected during tactical review.'
      };
    }

    return indent;
  }
}

module.exports = new TacticalStore();
