export interface DocumentTemplate {
  id: string
  title: string
  category: 'policy' | 'report' | 'memo' | 'sop' | 'notes'
  description: string
  iconName: string
  color: string
  htmlContent: string
}

export interface TemplateContext {
  companyName?: string
  authorName?: string
  currency?: string
  role?: string
}

export function getCurrencySymbol(curr?: string): string {
  switch (curr?.toUpperCase()) {
    case 'NGN':
      return '₦'
    case 'USD':
      return '$'
    case 'KES':
      return 'KSh '
    case 'GHS':
      return 'GH₵ '
    case 'GBP':
      return '£'
    case 'EUR':
      return '€'
    default:
      return '₦'
  }
}

export function getDocumentTemplates(ctx: TemplateContext = {}): DocumentTemplate[] {
  const company = ctx.companyName || 'Business Organization'
  const author = ctx.authorName || 'Authorized Officer'
  const role = ctx.role || 'Store Manager'
  const symbol = getCurrencySymbol(ctx.currency)
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const currentYear = new Date().getFullYear()

  return [
    {
      id: 'blank',
      title: 'Blank Document',
      category: 'notes',
      description: 'Start with a clean blank page for memos, draft notes or custom documentation.',
      iconName: 'File',
      color: '#3b82f6',
      htmlContent: `
        <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 16px;">Untitled Document</h1>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">Start typing your document content here...</p>
      `,
    },
    {
      id: 'sop-standard',
      title: 'Standard Operating Procedure (SOP)',
      category: 'sop',
      description: 'Operational guidelines, daily checklists, safety protocols and execution steps.',
      iconName: 'ClipboardList',
      color: '#10b981',
      htmlContent: `
        <div style="border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: -0.5px;">${company}</h1>
          <p style="font-size: 15px; color: #4b5563; margin: 0 0 16px 0; font-weight: 500;">Standard Operating Procedure: Store Opening, Till Handover & Inventory Protocol</p>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; background-color: #f9fafb;">
            <tbody>
              <tr style="border: 1px solid #e5e7eb;">
                <td style="padding: 8px 12px; font-weight: 600; width: 25%; color: #374151; background-color: #f3f4f6;">Document Ref:</td>
                <td style="padding: 8px 12px; width: 25%; color: #111827;">SOP-${currentYear}-OPS01</td>
                <td style="padding: 8px 12px; font-weight: 600; width: 25%; color: #374151; background-color: #f3f4f6;">Effective Date:</td>
                <td style="padding: 8px 12px; width: 25%; color: #111827;">${today}</td>
              </tr>
              <tr style="border: 1px solid #e5e7eb;">
                <td style="padding: 8px 12px; font-weight: 600; color: #374151; background-color: #f3f4f6;">Department:</td>
                <td style="padding: 8px 12px; color: #111827;">Retail & Inventory Operations</td>
                <td style="padding: 8px 12px; font-weight: 600; color: #374151; background-color: #f3f4f6;">Approved By:</td>
                <td style="padding: 8px 12px; color: #111827;">${author} (${role})</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">1. Purpose & Scope</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 16px;">
          The purpose of this procedure is to establish a strict, repeatable standard for store opening routines, POS register float counts, and inventory handovers across all retail stations at <strong>${company}</strong>.
        </p>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">2. Daily Step-by-Step Checklist</h2>
        <ul style="font-size: 14px; color: #374151; line-height: 1.8; margin-bottom: 16px; padding-left: 20px;">
          <li><strong>07:45 AM:</strong> Deactivate perimeter alarms, inspect physical premises, and ensure all security locks are intact.</li>
          <li><strong>08:00 AM:</strong> Unlock the central safe, verify the opening float per cash drawer, and record starting float in the Daily Cashbook.</li>
          <li><strong>08:15 AM:</strong> Power on POS stations, test barcode scanners, and verify offline database synchronization status.</li>
          <li><strong>08:30 AM:</strong> Conduct visual inventory audits across fast-moving shelves and replenish front-facing stock.</li>
        </ul>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">3. Till Discrepancy & Threshold Rules</h2>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 500;">
            <strong>MANDATORY PROTOCOL:</strong> Any physical cash discrepancy exceeding <strong>${symbol}5,000</strong> must be flagged to the ${role} immediately before shift close.
          </p>
        </div>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">4. Compliance Sign-Off</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
          <tbody>
            <tr>
              <td style="width: 50%; padding-right: 24px;">
                <p style="margin-bottom: 36px; color: #6b7280; font-size: 12px;">Prepared By:</p>
                <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 4px;"></div>
                <p style="margin: 0; font-weight: 600; color: #111827;">${author}</p>
                <p style="margin: 0; font-size: 11px; color: #6b7280;">Date: ${today}</p>
              </td>
              <td style="width: 50%; padding-left: 24px;">
                <p style="margin-bottom: 36px; color: #6b7280; font-size: 12px;">Witnessed / Authorized By:</p>
                <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 4px;"></div>
                <p style="margin: 0; font-weight: 600; color: #111827;">Executive Auditor Signature & Stamp</p>
                <p style="margin: 0; font-size: 11px; color: #6b7280;">Date: ____________________</p>
              </td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      id: 'business-report',
      title: 'Business Performance Report',
      category: 'report',
      description: 'Executive revenue summaries, expenditure breakdown, and profit & loss analysis.',
      iconName: 'BarChart2',
      color: '#8b5cf6',
      htmlContent: `
        <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">${company} — Business Performance Report</h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Period: Financial Year ${currentYear} • Prepared by ${author} (${role})</p>
        </div>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 20px; margin-bottom: 8px;">1. Executive Summary</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          This report provides an executive overview of operational cashflow, retail point-of-sale volume, inventory margins, and departmental expenditures for <strong>${company}</strong>. All financial records are reconciled directly against the immutable POS audit log and cashbook ledgers.
        </p>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">2. Operational Overview & Metrics</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #374151;">Performance Metric</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #374151;">Target</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #374151;">Actual</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #374151;">Variance</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 12px; color: #111827; font-weight: 500;">Gross Sales Turnover</td>
              <td style="padding: 10px 12px; text-align: right; color: #4b5563;">${symbol}10,000,000</td>
              <td style="padding: 10px 12px; text-align: right; color: #111827; font-weight: 600;">${symbol}12,450,000</td>
              <td style="padding: 10px 12px; text-align: right; color: #10b981; font-weight: 600;">+24.5%</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 12px; color: #111827; font-weight: 500;">Inventory Cost of Goods (COGS)</td>
              <td style="padding: 10px 12px; text-align: right; color: #4b5563;">${symbol}6,500,000</td>
              <td style="padding: 10px 12px; text-align: right; color: #111827; font-weight: 600;">${symbol}7,100,000</td>
              <td style="padding: 10px 12px; text-align: right; color: #4b5563; font-weight: 600;">Normal</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 12px; color: #111827; font-weight: 500;">Operating & Administrative Outflows</td>
              <td style="padding: 10px 12px; text-align: right; color: #4b5563;">${symbol}2,000,000</td>
              <td style="padding: 10px 12px; text-align: right; color: #111827; font-weight: 600;">${symbol}1,820,000</td>
              <td style="padding: 10px 12px; text-align: right; color: #10b981; font-weight: 600;">-9.0%</td>
            </tr>
            <tr style="background-color: #f9fafb; font-weight: 700; border-top: 2px solid #d1d5db;">
              <td style="padding: 12px; color: #111827;">Net Operating Profit</td>
              <td style="padding: 12px; text-align: right; color: #4b5563;">${symbol}1,500,000</td>
              <td style="padding: 12px; text-align: right; color: #111827;">${symbol}3,530,000</td>
              <td style="padding: 12px; text-align: right; color: #10b981;">+135.3%</td>
            </tr>
          </tbody>
        </table>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">3. Strategic Recommendations</h2>
        <ul style="font-size: 14px; color: #374151; line-height: 1.6; padding-left: 20px;">
          <li>Automate low-stock alerts on high-turnover fast-moving inventory items.</li>
          <li>Enforce daily cash-drawer float reconciliation to eliminate end-of-month cashier variances.</li>
          <li>Review supplier terms to negotiate extended settlement credit windows.</li>
        </ul>
      `,
    },
    {
      id: 'store-policy',
      title: 'Store Audit & Cash Handling Policy',
      category: 'policy',
      description: 'Cashier float controls, discount override limits, and audit protocols.',
      iconName: 'ShieldCheck',
      color: '#f59e0b',
      htmlContent: `
        <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">${company} — Cash Handling & Audit Policy</h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Policy Ref: POL-${currentYear}-04 • Effective Immediately Across All Branches</p>
        </div>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 20px; margin-bottom: 8px;">1. Objective</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          This policy defines standard operating guidelines for physical cash handling, digital point-of-sale register reconciliation, price overrides, and shift closure audits at <strong>${company}</strong>.
        </p>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">2. Cashier Responsibilities</h2>
        <ol style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
          <li>Every cashier must verify the physical opening float count prior to logging into their designated POS station.</li>
          <li>Personal funds, mobile money transfers, and private phones are strictly prohibited within the till area.</li>
          <li>Cash drops exceeding <strong>${symbol}100,000</strong> must be transferred directly to the store safe with a dual-signature deposit voucher.</li>
        </ol>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">3. Override & Discount Limits</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          Manual discounts exceeding <strong>10%</strong> or price adjustments require ${role} authorization before the transaction receipt can be finalized.
        </p>
      `,
    },
    {
      id: 'staff-contract',
      title: 'Staff Employment Offer Letter',
      category: 'memo',
      description: 'Formal employment offer, role specifications, salary, and confidentiality terms.',
      iconName: 'UserCheck',
      color: '#06b6d4',
      htmlContent: `
        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">${company} — Offer of Employment</h1>
          <p style="font-size: 13px; color: #6b7280; margin: 0;">Date: ${today}</p>
        </div>

        <p style="font-size: 14px; color: #111827; line-height: 1.6;"><strong>Dear Appointee,</strong></p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          On behalf of <strong>${company}</strong>, we are pleased to offer you employment for the position outlined below. This agreement confirms the key terms governing your employment:
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600; width: 35%; color: #374151;">Position Title:</td>
              <td style="padding: 10px 0; color: #111827;">Store Operations Specialist / Cashier</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600; color: #374151;">Department:</td>
              <td style="padding: 10px 0; color: #111827;">Retail & Sales Floor</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600; color: #374151;">Reporting Manager:</td>
              <td style="padding: 10px 0; color: #111827;">${author} (${role})</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600; color: #374151;">Standard Working Hours:</td>
              <td style="padding: 10px 0; color: #111827;">40 hours / week (Scheduled on Weekly Rota)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600; color: #374151;">Commencement Date:</td>
              <td style="padding: 10px 0; color: #111827;">${today}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">Acceptance & Signatures</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 32px;">
          <tbody>
            <tr>
              <td style="width: 50%; padding-right: 20px;">
                <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 6px; height: 32px;"></div>
                <p style="margin: 0; font-weight: 600; color: #111827;">${author}</p>
                <p style="margin: 0; font-size: 11px; color: #6b7280;">For: ${company}</p>
              </td>
              <td style="width: 50%; padding-left: 20px;">
                <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 6px; height: 32px;"></div>
                <p style="margin: 0; font-weight: 600; color: #111827;">Employee Acceptance Signature</p>
                <p style="margin: 0; font-size: 11px; color: #6b7280;">Date: ____________________</p>
              </td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      id: 'meeting-minutes',
      title: 'Meeting Minutes & Action Plan',
      category: 'notes',
      description: 'Weekly team meetings, agenda review, decisions made, and assigned tasks.',
      iconName: 'ListChecks',
      color: '#ec4899',
      htmlContent: `
        <div style="border-bottom: 2px solid #ec4899; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">${company} — Operations Meeting Minutes</h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Date: ${today} • Meeting Chair: ${author} (${role})</p>
        </div>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 20px; margin-bottom: 8px;">1. Meeting Agenda & Overview</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          Review of weekly point-of-sale volume, inventory restock cycle, and staff rota allocation across all active departments.
        </p>

        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">2. Action Items & Assignments</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #374151;">Task / Action</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #374151;">Assigned Owner</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #374151;">Target Date</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 600; color: #374151;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 12px; color: #111827;">Audit cash drawer float balances</td>
              <td style="padding: 8px 12px; color: #4b5563;">Duty Cashier</td>
              <td style="padding: 8px 12px; color: #4b5563;">Daily</td>
              <td style="padding: 8px 12px; text-align: center;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">Active</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 12px; color: #111827;">Replenish fast-moving inventory stock</td>
              <td style="padding: 8px 12px; color: #4b5563;">Inventory Officer</td>
              <td style="padding: 8px 12px; color: #4b5563;">Weekly</td>
              <td style="padding: 8px 12px; text-align: center;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">Scheduled</span></td>
            </tr>
          </tbody>
        </table>
      `,
    },
  ]
}

export const DOCUMENT_TEMPLATES = getDocumentTemplates()
