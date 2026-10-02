/**
 * P-LFSCS: Indent & Supply Requisition Management
 * Connects with /api/v1/indents
 */

let selectedCategoryFilter = 'ALL';
let selectedPriorityFilter = 'ALL';

function renderIndentsTable() {
  const tbody = document.getElementById('indents-table-body');
  if (!tbody) return;

  let list = AppState.indents || [];

  if (selectedCategoryFilter !== 'ALL') {
    list = list.filter(i => i.category === selectedCategoryFilter);
  }
  if (selectedPriorityFilter !== 'ALL') {
    list = list.filter(i => i.priority === selectedPriorityFilter);
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">No matching requisitions recorded.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(item => {
    return `
      <tr>
        <td><strong style="color:#fff; font-family:var(--font-mono);">${item._id ? item._id.substring(item._id.length - 6).toUpperCase() : 'IND-01'}</strong></td>
        <td><strong>${item.unitName}</strong></td>
        <td>
          <span style="font-weight:600; color:var(--accent-cyan); font-family:var(--font-tactical);">
            ${item.category}
          </span>
        </td>
        <td><strong style="font-family:var(--font-mono);">${item.quantity.toLocaleString()}</strong></td>
        <td>
          <span class="badge-priority priority-${item.priority}">
            ${item.priority}
          </span>
        </td>
        <td>
          <span class="badge-status status-${item.status}">
            ${item.status}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            ${item.status === 'PENDING' ? `
              <button class="btn-hud btn-primary" style="padding:2px 8px; font-size:0.75rem;" onclick="updateIndentStatus('${item._id}', 'APPROVED')">
                APPROVE
              </button>
            ` : ''}
            ${item.status === 'APPROVED' ? `
              <button class="btn-hud" style="padding:2px 8px; font-size:0.75rem; border-color:var(--accent-cyan); color:var(--accent-cyan);" onclick="updateIndentStatus('${item._id}', 'DISPATCHED')">
                DISPATCH
              </button>
            ` : ''}
            ${item.status === 'DISPATCHED' ? `
              <button class="btn-hud" style="padding:2px 8px; font-size:0.75rem; border-color:var(--accent-purple); color:var(--accent-purple);" onclick="updateIndentStatus('${item._id}', 'DELIVERED')">
                DELIVERED
              </button>
            ` : ''}
            ${item.status === 'DELIVERED' ? `
              <span style="font-size:0.75rem; color:var(--accent-green); font-family:var(--font-mono);">COMPLETED</span>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateIndentStatus(indentId, newStatus) {
  const indent = AppState.indents.find(i => i._id === indentId);
  if (!indent) return;

  indent.status = newStatus;
  renderIndentsTable();
  updateKPIs();
  AudioFX.playBeep(1100, 0.06);

  logAudit(
    'INDENT_STATUS_UPDATE',
    `Requisition for ${indent.unitName} (${indent.category}) updated to ${newStatus}`
  );
}

function initIndents() {
  const modal = document.getElementById('indent-modal');
  const openBtn = document.getElementById('btn-open-create-indent');
  const closeBtn = document.getElementById('btn-close-indent');
  const form = document.getElementById('new-indent-form');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  // Filter dropdowns
  const catFilter = document.getElementById('indent-filter-category');
  const priFilter = document.getElementById('indent-filter-priority');

  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      selectedCategoryFilter = e.target.value;
      renderIndentsTable();
    });
  }
  if (priFilter) {
    priFilter.addEventListener('change', (e) => {
      selectedPriorityFilter = e.target.value;
      renderIndentsTable();
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const unitName = document.getElementById('indent-unit').value.trim();
      const category = document.getElementById('indent-category').value;
      const quantity = parseInt(document.getElementById('indent-quantity').value);
      const priority = document.getElementById('indent-priority').value;

      const payload = { unitName, category, quantity, priority };

      try {
        const res = await fetch(`${API_BASE}/api/v1/indents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const newIndent = await res.json();
          AppState.indents.unshift(newIndent);
        } else {
          throw new Error('API Error');
        }
      } catch (err) {
        // Fallback local creation
        const localIndent = {
          _id: 'IND-' + Math.floor(1000 + Math.random() * 9000),
          unitName,
          category,
          quantity,
          priority,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
        AppState.indents.unshift(localIndent);
      }

      renderIndentsTable();
      updateKPIs();
      modal.classList.remove('active');
      form.reset();
      AudioFX.playBeep(1250, 0.08);

      logAudit(
        'REQUISITION_RAISED',
        `Unit: ${unitName} | Category: ${category} | Qty: ${quantity} | Priority: ${priority}`,
        priority === 'CRITICAL' ? 'warn' : 'normal'
      );
    });
  }
}

// Global Exports
window.renderIndentsTable = renderIndentsTable;
window.initIndents = initIndents;
window.updateIndentStatus = updateIndentStatus;

window.addEventListener('DOMContentLoaded', () => {
  initIndents();
});
