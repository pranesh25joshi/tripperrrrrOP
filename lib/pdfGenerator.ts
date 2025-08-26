import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: any;
  }
}

export interface PDFExpense {
  date: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  splitBetween: Array<{ name: string; amount: number; percentage: number }>;
  currency: string;
  createdBy: string;
  createdAt: string;
}

export interface PDFSettlement {
  from: string;
  to: string;
  amount: number;
  currency: string;
  description: string;
}

export interface PDFMember {
  name: string;
  email: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
  currency: string;
  expenseCount: number;
  joinedDate: string;
}

export interface PDFTripData {
  tripName: string;
  startDate: string;
  endDate: string;
  status: string;
  totalExpenses: number;
  currency: string;
  expenses: PDFExpense[];
  settlements: PDFSettlement[];
  members: PDFMember[];
  statistics: {
    totalAmount: number;
    averagePerPerson: number;
    expensesByCategory: Record<string, { count: number; total: number }>;
    expensesByMember: Record<string, { count: number; total: number }>;
    mostExpensiveExpense: { description: string; amount: number; date: string };
    dailyBreakdown: Record<string, number>;
  };
}

export function generateTripSummaryPDF(data: PDFTripData): Buffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let currentY = 20;

  // Color scheme
  const colors = {
    primary: [59, 130, 246] as const, // Blue
    secondary: [16, 185, 129] as const, // Green
    accent: [239, 68, 68] as const, // Red
    gray: [107, 114, 128] as const,
    lightGray: [243, 244, 246] as const
  };

  // Helper functions
  const addPage = () => {
    doc.addPage();
    currentY = 20;
  };

  const checkSpace = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - 20) {
      addPage();
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const curr = currency || data.currency || 'INR';
    return `${curr} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Page 1: Trip Overview & Summary
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TRIP EXPENSE REPORT', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.tripName, pageWidth / 2, 35, { align: 'center' });

  currentY = 50;
  doc.setTextColor(0, 0, 0);

  // Trip Information Box
  doc.setFillColor(...colors.lightGray);
  doc.rect(10, currentY, pageWidth - 20, 35, 'F');
  doc.setDrawColor(...colors.gray);
  doc.rect(10, currentY, pageWidth - 20, 35, 'S');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Trip Information', 15, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const leftCol = 15;
  const rightCol = pageWidth / 2 + 10;
  
  doc.text(`Start Date: ${formatDate(data.startDate)}`, leftCol, currentY + 18);
  doc.text(`End Date: ${formatDate(data.endDate)}`, leftCol, currentY + 25);
  doc.text(`Status: ${data.status.toUpperCase()}`, leftCol, currentY + 32);
  
  doc.text(`Total Expenses: ${formatCurrency(data.statistics.totalAmount)}`, rightCol, currentY + 18);
  doc.text(`Number of Expenses: ${data.expenses.length}`, rightCol, currentY + 25);
  doc.text(`Number of Members: ${data.members.length}`, rightCol, currentY + 32);

  currentY += 50;

  // Key Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('📊 Key Statistics', 15, currentY);
  currentY += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Statistics in a grid
  const calculateDuration = () => {
    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Unknown duration';
      }
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } catch (error) {
      return 'Unknown duration';
    }
  };

  const stats = [
    [`Average per person:`, `${formatCurrency(data.statistics.averagePerPerson)}`],
    [`Most expensive:`, `${data.statistics.mostExpensiveExpense.description} (${formatCurrency(data.statistics.mostExpensiveExpense.amount)})`],
    [`Categories used:`, `${Object.keys(data.statistics.expensesByCategory).length}`],
    [`Duration:`, calculateDuration()]
  ];

  stats.forEach(([label, value], index) => {
    const y = currentY + (index * 7);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, y);
  });

  currentY += 35;

  // Category Breakdown
  checkSpace(60);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('🏷️ Expense Categories', 15, currentY);
  currentY += 10;

  const categoryData = Object.entries(data.statistics.expensesByCategory).map(([category, stats]) => [
    category.charAt(0).toUpperCase() + category.slice(1),
    stats.count.toString(),
    formatCurrency(stats.total),
    `${((stats.total / data.statistics.totalAmount) * 100).toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Count', 'Total', 'Percentage']],
    body: categoryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Member Summary
  checkSpace(60);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('👥 Member Summary', 15, currentY);
  currentY += 10;

  const memberData = data.members.map(member => [
    member.name,
    member.expenseCount.toString(),
    formatCurrency(member.totalPaid, member.currency),
    formatCurrency(member.totalOwed, member.currency),
    formatCurrency(member.balance, member.currency),
    member.balance > 0 ? 'Should Receive' : member.balance < 0 ? 'Should Pay' : 'Settled'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Member', 'Expenses', 'Total Paid', 'Total Owed', 'Balance', 'Status']],
    body: memberData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' }
    }
  });

  // Page 2: Detailed Expenses
  addPage();
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('💰 Detailed Expense List', 15, currentY);
  currentY += 15;

  const expenseData = data.expenses.map(expense => [
    formatDate(expense.date),
    expense.description.substring(0, 30) + (expense.description.length > 30 ? '...' : ''),
    formatCurrency(expense.amount, expense.currency),
    expense.category,
    expense.paidBy,
    expense.splitBetween.length > 1 ? `Split ${expense.splitBetween.length} ways` : 'Individual'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Description', 'Amount', 'Category', 'Paid By', 'Split Type']],
    body: expenseData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { halign: 'right', cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { halign: 'center', cellWidth: 25 }
    }
  });

  // Page 3: Settlement Instructions
  addPage();
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('💸 Settlement Instructions', 15, currentY);
  currentY += 15;

  if (data.settlements.length === 0) {
    doc.setFillColor(...colors.secondary);
    doc.rect(15, currentY, pageWidth - 30, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('🎉 Congratulations!', pageWidth / 2, currentY + 12, { align: 'center' });
    doc.setFontSize(12);
    doc.text('All expenses are perfectly balanced. No settlements required!', pageWidth / 2, currentY + 22, { align: 'center' });
  } else {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('To settle all expenses, please complete the following payments:', 15, currentY);
    currentY += 10;

    const settlementData = data.settlements.map((settlement, index) => [
      (index + 1).toString(),
      settlement.from,
      settlement.to,
      formatCurrency(settlement.amount, settlement.currency),
      settlement.description || 'Balance settlement'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'From', 'To', 'Amount', 'Description']],
      body: settlementData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right', cellWidth: 30 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Settlement Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Settlement Summary:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 8;

    const totalSettlements = data.settlements.reduce((sum, s) => sum + s.amount, 0);
    doc.text(`• Total amount to be settled: ${formatCurrency(totalSettlements)}`, 20, currentY);
    currentY += 6;
    doc.text(`• Number of transactions required: ${data.settlements.length}`, 20, currentY);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...colors.gray);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray);
    doc.text(`Generated by Tripper on ${new Date().toLocaleDateString()}`, 15, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}

export function generateTripSummaryFileName(tripName: string, endDate: string): string {
  const sanitizedTripName = tripName.replace(/[^a-zA-Z0-9]/g, '_');
  
  let dateStr: string;
  try {
    const date = new Date(endDate);
    if (isNaN(date.getTime())) {
      dateStr = new Date().toISOString().split('T')[0];
    } else {
      dateStr = date.toISOString().split('T')[0];
    }
  } catch (error) {
    dateStr = new Date().toISOString().split('T')[0];
  }
  
  return `${sanitizedTripName}_Trip_Report_${dateStr}.pdf`;
}
