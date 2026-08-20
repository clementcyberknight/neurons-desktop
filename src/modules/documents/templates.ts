export interface DocumentTemplate {
  id: string
  title: string
  category: 'policy' | 'report' | 'memo' | 'sop' | 'notes'
  description: string
  iconName: string
  color: string
  htmlContent: string
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    title: 'Blank Document',
    category: 'notes',
    description: 'Start with a clean blank page for memos, draft notes or custom documents.',
    iconName: 'File',
    color: '#3b82f6',
    htmlContent: `
      <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 16px;">Untitled Document</h1>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">Start typing your document here...</p>
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
        <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: -0.5px;">Standard Operating Procedure</h1>
        <p style="font-size: 15px; color: #4b5563; margin: 0 0 16px 0; font-weight: 500;">Store Opening, Till Handover & Inventory Protocol</p>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; background-color: #f9fafb;">
          <tbody>
            <tr style="border: 1px solid #e5e7eb;">
              <td style="padding: 8px 12px; font-weight: 600; width: 25%; color: #374151; background-color: #f3f4f6;">Document Ref:</td>
              <td style="padding: 8px 12px; width: 25%; color: #111827;">SOP-2026-OPS01</td>
              <td style="padding: 8px 12px; font-weight: 600; width: 25%; color: #374151; background-color: #f3f4f6;">Effective Date:</td>
              <td style="padding: 8px 12px; width: 25%; color: #111827;">August 20, 2026</td>
            </tr>
            <tr style="border: 1px solid #e5e7eb;">
              <td style="padding: 8px 12px; font-weight: 600; color: #374151; background-color: #f3f4f6;">Department:</td>
              <td style="padding: 8px 12px; color: #111827;">Retail & Cash Operations</td>
              <td style="padding: 8px 12px; font-weight: 600; color: #374151; background-color: #f3f4f6;">Approved By:</td>
              <td style="padding: 8px 12px; color: #111827;">Store Manager</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">1. Purpose & Scope</h2>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 16px;">
        The purpose of this procedure is to establish a strict, repeatable protocol for store opening routines, POS register float counts, and stock level handovers across all retail stations.
      </p>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">2. Daily Step-by-Step Checklist</h2>
      <ul style="font-size: 14px; color: #374151; line-height: 1.8; margin-bottom: 16px; padding-left: 20px;">
        <li><strong>07:45 AM:</strong> Deactivate store perimeter alarms and inspect physical premises.</li>
        <li><strong>08:00 AM:</strong> Unlock the central safe, verify the <strong>₦50,000 opening float</strong> per cash drawer, and log notes in the Daily Cashbook.</li>
        <li><strong>08:15 AM:</strong> Power on POS terminals, test thermal barcode scanners, and confirm offline database synchronization.</li>
        <li><strong>08:30 AM:</strong> Conduct visual inventory audit across Zone A (Fast moving stock) and replenish shelf frontages.</li>
      </ul>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">3. Till Discrepancy Rules</h2>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 500;">
          <strong>MANDATORY ALERT:</strong> Any physical cash discrepancy exceeding <strong>₦5,000</strong> must be flagged to the Store Manager immediately before shift close.
        </p>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">4. Compliance Sign-Off</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
        <tbody>
          <tr>
            <td style="width: 50%; padding-right: 24px;">
              <p style="margin-bottom: 36px; color: #6b7280; font-size: 12px;">Prepared By:</p>
              <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 4px;"></div>
              <p style="margin: 0; font-weight: 600; color: #111827;">Supervisor Signature / Date</p>
            </td>
            <td style="width: 50%; padding-left: 24px;">
              <p style="margin-bottom: 36px; color: #6b7280; font-size: 12px;">Authorized By:</p>
              <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 4px;"></div>
              <p style="margin: 0; font-weight: 600; color: #111827;">Branch Manager Signature / Date</p>
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
        <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">Executive Business Performance Report</h1>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Period: Q3 2026 • Published by Management</p>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 20px; margin-bottom: 8px;">1. Executive Summary</h2>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        During the third quarter of 2026, total store revenue generated across retail POS registers reached <strong>₦14,850,000</strong>, reflecting a <strong>14.2% growth</strong> compared to the previous quarter. Operating expenses remained well controlled within the ₦3.2M budget ceiling.
      </p>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">2. Financial Breakdown</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #374151;">Category / Stream</th>
            <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #374151;">Q2 Actual</th>
            <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #374151;">Q3 Actual</th>
            <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #374151;">Growth (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; color: #111827; font-weight: 500;">Retail Pharmacy & OTC</td>
            <td style="padding: 10px 12px; text-align: right; color: #4b5563;">₦7,400,000</td>
            <td style="padding: 10px 12px; text-align: right; color: #111827; font-weight: 600;">₦8,920,000</td>
            <td style="padding: 10px 12px; text-align: right; color: #10b981; font-weight: 600;">+20.5%</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; color: #111827; font-weight: 500;">FMCG & Consumer Goods</td>
            <td style="padding: 10px 12px; text-align: right; color: #4b5563;">₦4,200,000</td>
            <td style="padding: 10px 12px; text-align: right; color: #111827; font-weight: 600;">₦4,630,000</td>
            <td style="padding: 10px 12px; text-align: right; color: #10b981; font-weight: 600;">+10.2%</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 12px; color: #111827; font-weight: 500;">Wholesale Supplies</td>
            <td style="padding: 10px 12px; text-align: right; color: #4b5563;">₦1,400,000</td>
            <td style="padding: 10px 12px; text-align: right; color: #111827; font-weight: 600;">₦1,300,000</td>
            <td style="padding: 10px 12px; text-align: right; color: #ef4444; font-weight: 600;">-7.1%</td>
          </tr>
          <tr style="background-color: #f9fafb; font-weight: 700; border-top: 2px solid #d1d5db;">
            <td style="padding: 12px; color: #111827;">Total Gross Revenue</td>
            <td style="padding: 12px; text-align: right; color: #4b5563;">₦13,000,000</td>
            <td style="padding: 12px; text-align: right; color: #111827;">₦14,850,000</td>
            <td style="padding: 12px; text-align: right; color: #10b981;">+14.2%</td>
          </tr>
        </tbody>
      </table>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">3. Strategic Action Items</h2>
      <ul style="font-size: 14px; color: #374151; line-height: 1.6; padding-left: 20px;">
        <li>Automate reorder thresholds for Zone A items to prevent stockout bottlenecks.</li>
        <li>Review supplier payment terms to extend working capital credit by 15 days.</li>
      </ul>
    `,
  },
  {
    id: 'store-policy',
    title: 'Store Audit & Till Policy',
    category: 'policy',
    description: 'Cashier float controls, discount override limits, and audit protocols.',
    iconName: 'ShieldCheck',
    color: '#f59e0b',
    htmlContent: `
      <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 24px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">Cash Handling & Till Audit Policy</h1>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Policy Ref: POL-2026-04 • Applicable to All Retail Branches</p>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 20px; margin-bottom: 8px;">1. Objective</h2>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        This policy governs the physical handling of cash, digital POS reconciliation, discount override authorization, and end-of-shift audits to prevent cashier shortfalls and fraudulent refunds.
      </p>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">2. Cashier Responsibilities</h2>
      <ol style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
        <li>Every cashier must verify the opening float denomination count prior to logging into their POS terminal.</li>
        <li>Personal cash, mobile wallets, or private phones are strictly prohibited within the checkout till area.</li>
        <li>Cash drops exceeding <strong>₦200,000</strong> must be transferred directly to the store safe with a dual-signature deposit voucher.</li>
      </ol>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">3. Override & Discount Limits</h2>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        Manual discounts exceeding <strong>10%</strong> or transactions flagged as price overrides require Store Manager biometric or PIN authorization before the receipt can be printed.
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
        <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">Offer of Employment</h1>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">Date: August 20, 2026</p>
      </div>

      <p style="font-size: 14px; color: #111827; line-height: 1.6;"><strong>Dear Candidate,</strong></p>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        We are pleased to offer you the position of <strong>Staff Pharmacist / Retail Supervisor</strong> at our store branch. Below are the terms and conditions governing your employment:
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; width: 35%; color: #374151;">Position Title:</td>
            <td style="padding: 10px 0; color: #111827;">Staff Pharmacist</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #374151;">Department:</td>
            <td style="padding: 10px 0; color: #111827;">Pharmacy & Dispensary</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #374151;">Monthly Gross Salary:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 600;">₦350,000.00 / month</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #374151;">Working Hours:</td>
            <td style="padding: 10px 0; color: #111827;">40 hours / week (Scheduled on Weekly Rota)</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #374151;">Start Date:</td>
            <td style="padding: 10px 0; color: #111827;">September 1, 2026</td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">Acceptance & Signatures</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 32px;">
        <tbody>
          <tr>
            <td style="width: 50%; padding-right: 20px;">
              <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 6px; height: 32px;"></div>
              <p style="margin: 0; font-weight: 600; color: #111827;">Employer Authorized Signatory</p>
            </td>
            <td style="width: 50%; padding-left: 20px;">
              <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 6px; height: 32px;"></div>
              <p style="margin: 0; font-weight: 600; color: #111827;">Candidate Acceptance Signature</p>
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
        <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0;">Weekly Operations Meeting Minutes</h1>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Date: August 20, 2026 • Location: Store Boardroom</p>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 20px; margin-bottom: 8px;">1. Meeting Information</h2>
      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        <strong>Attendees:</strong> Akhimien Clement (Chair), Dr. Sarah Johnson, Mr. David Kim, Ms. Clara Lee.<br>
        <strong>Absentees:</strong> None.
      </p>

      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">2. Action Items & Assignments</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #374151;">Task / Action</th>
            <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #374151;">Assigned Owner</th>
            <th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #374151;">Deadline</th>
            <th style="padding: 8px 12px; text-align: center; font-weight: 600; color: #374151;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 12px; color: #111827;">Audit POS discrepancy in Station 3</td>
            <td style="padding: 8px 12px; color: #4b5563;">Akhimien Clement</td>
            <td style="padding: 8px 12px; color: #4b5563;">2026-08-22</td>
            <td style="padding: 8px 12px; text-align: center;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">In Progress</span></td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 12px; color: #111827;">Restock Zone A Pharmaceuticals</td>
            <td style="padding: 8px 12px; color: #4b5563;">Dr. Sarah Johnson</td>
            <td style="padding: 8px 12px; color: #4b5563;">2026-08-23</td>
            <td style="padding: 8px 12px; text-align: center;"><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">Done</span></td>
          </tr>
        </tbody>
      </table>
    `,
  },
]
