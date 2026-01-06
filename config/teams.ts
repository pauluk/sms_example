export const GLOBAL_TEMPLATE_ID = "c3fd072a-48b1-478d-ba99-d6f74a84150d";
export const DEFAULT_SENDER_ID = "4778eaa6-d552-4bc4-82ad-deaa86ea0385"; // Default (NHSBSAFinOp)

export interface TeamConfig {
    id: string;
    label: string;
    manager: string;
    email: string;
    smsSenderId?: string;
    inputs: { name: string; label: string; type?: string; placeholder?: string }[];
    examples: { label: string; data: Record<string, string> }[];
    generateMessage: (data: Record<string, string>) => string;
}

export const TEAMS: Record<string, TeamConfig> = {
    AP: {
        id: 'accounts-payable',
        label: 'Accounts Payable',
        manager: 'Sarah Jenkins',
        email: 'ap@company.com',
        smsSenderId: 'ed1e3d46-42fa-4b1e-9820-2dfa033f0dc4',
        inputs: [
            { name: "supplierId", label: "Supplier ID", placeholder: "e.g. SUP-001" },
            { name: "invoiceRef", label: "Invoice Ref", placeholder: "e.g. INV-2023-001" },
            { name: "amount", label: "Amount", placeholder: "e.g. 500.00" },
            { name: "paymentDate", label: "Payment Date", type: "date", placeholder: "" },
            { name: "status", label: "Status", placeholder: "e.g. Paid, Processing" }
        ],
        examples: [
            { label: "Payment Sent", data: { supplierId: "SUP-101", invoiceRef: "INV-99", amount: "1200.50", paymentDate: "2023-10-25", status: "Paid" } },
            { label: "Processing Delay", data: { supplierId: "SUP-204", invoiceRef: "INV-102", amount: "300.00", paymentDate: "", status: "Delayed - Reviewing" } }
        ],
        generateMessage: (data) =>
            `AP Alert: Payment of £${data.amount || '0.00'} for Supplier ${data.supplierId || '[ID]'} (Ref: ${data.invoiceRef || '[Ref]'}) status: ${data.status || '[Status]'}. Date: ${data.paymentDate || 'Pending'}.`
    },
    AR: {
        id: 'accounts-receivable',
        label: 'Accounts Receivable',
        manager: 'David Wu',
        email: 'ar@company.com',
        smsSenderId: '694ea148-e5db-4be7-ab23-24eda544b7a2',
        inputs: [
            { name: "customerName", label: "Customer Name", placeholder: "e.g. Acme Corp" },
            { name: "invoiceNum", label: "Invoice Number", placeholder: "e.g. INV-999" },
            { name: "dueDate", label: "Due Date", type: "date", placeholder: "" },
            { name: "amount", label: "Amount", type: "number", placeholder: "0.00" }
        ],
        examples: [
            { label: "Overdue Reminder", data: { customerName: "Acme Corp", invoiceNum: "INV-1001", dueDate: "2023-10-01", amount: "150.00" } },
            { label: "Final Notice", data: { customerName: "Globex", invoiceNum: "INV-8852", dueDate: "2023-09-15", amount: "4500.50" } }
        ],
        generateMessage: (data) =>
            `Dear ${data.customerName || 'Customer'}, Invoice ${data.invoiceNum || '[Number]'} for £${data.amount || '[Amount]'} was due on ${data.dueDate || '[Date]'}. Please remit payment.`
    },
    Treasury: {
        id: 'treasury',
        label: 'Treasury',
        manager: 'Ali Khan',
        email: 'treasury@company.com',
        smsSenderId: '55cf5a53-0322-4cf4-9d29-7f0f299dad17',
        inputs: [
            { name: "reference", label: "Transaction Ref", placeholder: "TRX-001" },
            { name: "counterparty", label: "Counterparty", placeholder: "Bank/Entity Name" },
            { name: "currency", label: "Currency", placeholder: "GBP" },
            { name: "amount", label: "Amount", type: "number", placeholder: "0.00" },
            { name: "action", label: "Action Required", placeholder: "Approval needed" }
        ],
        examples: [
            { label: "Large Forex Approval", data: { reference: "FX-999", counterparty: "Citi", currency: "USD", amount: "50000", action: "Urgent Approval" } },
            { label: "Audit Flag", data: { reference: "TRX-101", counterparty: "Internal", currency: "GBP", amount: "100", action: "Audit Review" } }
        ],
        generateMessage: (data) => `Treasury Action: ${data.action || '[Action]'} required for ${data.currency || 'GBP'} ${data.amount || '0'} transfer to ${data.counterparty || '[Entity]'} (Ref: ${data.reference || '[Ref]'}).`
    },
    Payroll: {
        id: 'payroll',
        label: 'Payroll',
        manager: 'Lisa Wong',
        email: 'payroll@company.com',
        smsSenderId: 'b35d5180-021c-46ab-a937-23952187c709',
        inputs: [
            { name: "employeeId", label: "Employee ID", placeholder: "EMP-123" },
            { name: "employeeName", label: "Employee Name", placeholder: "John Doe" },
            { name: "month", label: "Period", placeholder: "January 2026" },
            { name: "netPay", label: "Net Pay", placeholder: "2500.00" }
        ],
        examples: [
            { label: "Payslip Ready", data: { employeeId: "EMP-001", employeeName: "Sarah J", month: "October", netPay: "2400.00" } },
            { label: "Bonus Confirmed", data: { employeeId: "EMP-005", employeeName: "Mike T", month: "Q3 Bonus", netPay: "5000.00" } }
        ],
        generateMessage: (data) => `Payroll Notification: Hello ${data.employeeName || '[Name]'} (${data.employeeId || '[ID]'}). Your payslip for ${data.month || '[Period]'} (Net: £${data.netPay || '0.00'}) is available.`
    }
};
