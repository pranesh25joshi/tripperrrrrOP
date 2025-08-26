import { db } from "@/firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { 
  generateTripSummaryPDF,
  type PDFTripData,
  type PDFExpense,
  type PDFSettlement,
  type PDFMember
} from "@/lib/pdfGenerator";

interface Expense {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  date: any;
  category: string;
  paidBy: string;
  splitBetween: Array<{ userId: string; amount: number }>;
  createdBy: {
    uid: string;
    displayName?: string;
    photoURL?: string;
  };
  createdAt: any;
}

interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface UserDetails {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

// Generate HTML email template
function generateTripSummaryHTML(
  tripData: any,
  expenses: Expense[],
  settlements: Settlement[],
  memberDetails: Record<string, UserDetails>,
  statistics: any,
  hasAttachment: boolean = false
) {
  const formatDate = (date: any) => {
    if (!date) return 'Unknown Date';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const categoryIcons: Record<string, string> = {
    food: '🍽️',
    accommodation: '🏨',
    transport: '🚗',
    activities: '🎯',
    shopping: '🛍️',
    taxi: '🚕',
    coffee: '☕',
    fuel: '⛽',
    health: '🏥',
    other: '💰'
  };

return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trip Summary - ${tripData.name}</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
                background-color: #f8fafc;
            }
            .container { 
                background: white; 
                border-radius: 12px; 
                padding: 30px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                text-align: center; 
                border-bottom: 3px solid #3b82f6; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
            }
            .header h1 { 
                color: #1e40af; 
                margin: 0; 
                font-size: 28px; 
            }
            .trip-info { 
                background: #eff6ff; 
                padding: 20px; 
                border-radius: 8px; 
                margin-bottom: 30px; 
            }
            .trip-overview {
                background: #f0f9ff;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #0ea5e9;
            }
            .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 15px; 
                margin-bottom: 30px; 
            }
            .stat-card { 
                background: #f1f5f9; 
                padding: 15px; 
                border-radius: 8px; 
                text-align: center; 
            }
            .stat-card .value { 
                font-size: 24px; 
                font-weight: bold; 
                color: #1e40af; 
            }
            .stat-card .label { 
                color: #64748b; 
                font-size: 14px; 
                margin-top: 5px; 
            }
            .section { 
                margin-bottom: 30px; 
            }
            .section h2 { 
                color: #1e40af; 
                border-bottom: 2px solid #e2e8f0; 
                padding-bottom: 10px; 
            }
            .expense-item { 
                background: #fafafa; 
                border: 1px solid #e2e8f0; 
                border-radius: 8px; 
                padding: 15px; 
                margin-bottom: 10px; 
            }
            .expense-header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 8px; 
            }
            .expense-name { 
                font-weight: bold; 
                color: #1e40af; 
            }
            .expense-amount { 
                font-weight: bold; 
                color: #059669; 
                font-size: 18px; 
            }
            .expense-details { 
                font-size: 14px; 
                color: #64748b; 
            }
            .settlement-item { 
                background: #fef3c7; 
                border: 1px solid #f59e0b; 
                border-radius: 8px; 
                padding: 15px; 
                margin-bottom: 10px; 
                text-align: center; 
            }
            .settlement-amount { 
                font-size: 20px; 
                font-weight: bold; 
                color: #d97706; 
            }
            .no-settlements { 
                background: #d1fae5; 
                border: 1px solid #10b981; 
                border-radius: 8px; 
                padding: 20px; 
                text-align: center; 
                color: #047857; 
                font-weight: bold; 
            }
            .footer { 
                text-align: center; 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 1px solid #e2e8f0; 
                color: #64748b; 
                font-size: 14px; 
            }
            .category-badge { 
                display: inline-block; 
                background: #e2e8f0; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px; 
                margin-left: 10px; 
            }
            @media (max-width: 600px) {
                .stats-grid { grid-template-columns: 1fr 1fr; }
                .expense-header { flex-direction: column; align-items: flex-start; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Trip Summary</h1>
                <h2>${tripData.name}</h2>
            </div>

            <div class="trip-overview">
                <h3>✈️ Trip Overview</h3>
                <p>This is a summary of your recent trip with Tripper. Below you'll find detailed information about expenses, settlements, and trip statistics.</p>
                <p><strong>Trip ID:</strong> ${tripData.id}</p>
                <p><strong>Created by:</strong> ${tripData.createdBy?.displayName || 'Unknown'}</p>
                <p><strong>Total members:</strong> ${tripData.members?.length || 0}</p>
            </div>

            <div class="trip-info">
                <h3>📋 Trip Details</h3>
                <p><strong>Duration:</strong> ${formatDate(tripData.startDate)} - ${formatDate(tripData.endDate)}</p>
                <p><strong>Currency:</strong> ${tripData.currency || 'USD'}</p>
                <p><strong>Status:</strong> ${tripData.status || 'Completed'} ✅</p>
                <p><strong>Location:</strong> ${tripData.location || 'Not specified'}</p>
                ${tripData.description ? `<p><strong>Description:</strong> ${tripData.description}</p>` : ''}
                <p><strong>Trip length:</strong> ${
                    tripData.startDate && tripData.endDate ? 
                    Math.ceil((tripData.endDate.toDate ? tripData.endDate.toDate() : new Date(tripData.endDate)) - 
                    (tripData.startDate.toDate ? tripData.startDate.toDate() : new Date(tripData.startDate))) / (1000 * 60 * 60 * 24) : 'Unknown'
                } days</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="value">${formatCurrency(statistics.totalAmount, tripData.currency || 'USD')}</div>
                    <div class="label">Total Spent</div>
                </div>
                <div class="stat-card">
                    <div class="value">${expenses.length}</div>
                    <div class="label">Total Expenses</div>
                </div>
                <div class="stat-card">
                    <div class="value">${Object.keys(memberDetails).length}</div>
                    <div class="label">Trip Members</div>
                </div>
                <div class="stat-card">
                    <div class="value">${formatCurrency(statistics.averagePerPerson, tripData.currency || 'USD')}</div>
                    <div class="label">Average per Person</div>
                </div>
            </div>

            <div class="section">
                <h2>💰 All Expenses</h2>
                ${expenses.length === 0 ? 
                    '<p>No expenses were recorded for this trip.</p>' :
                    expenses.map(expense => `
                        <div class="expense-item">
                            <div class="expense-header">
                                <div>
                                    <span class="expense-name">${categoryIcons[expense.category] || '💰'} ${expense.name}</span>
                                    <span class="category-badge">${expense.category}</span>
                                </div>
                                <div class="expense-amount">${formatCurrency(expense.amount, expense.currency)}</div>
                            </div>
                            <div class="expense-details">
                                <div><strong>Paid by:</strong> ${memberDetails[expense.paidBy]?.displayName || 'Unknown'}</div>
                                <div><strong>Date:</strong> ${formatDate(expense.date)}</div>
                                ${expense.description ? `<div><strong>Details:</strong> ${expense.description}</div>` : ''}
                                <div><strong>Split between:</strong> ${expense.splitBetween.map(split => 
                                    `${memberDetails[split.userId]?.displayName || 'Unknown'} (${formatCurrency(split.amount, expense.currency)})`
                                ).join(', ')}</div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>

            <div class="section">
                <h2>⚖️ Settlement Summary</h2>
                ${settlements.length === 0 ? 
                    '<div class="no-settlements">🎉 Perfect! Everyone is settled up. No payments needed!</div>' :
                    settlements.map(settlement => `
                        <div class="settlement-item">
                            <div class="settlement-amount">
                                ${memberDetails[settlement.fromUserId]?.displayName || 'Unknown'} 
                                owes 
                                ${memberDetails[settlement.toUserId]?.displayName || 'Unknown'}
                            </div>
                            <div style="margin-top: 10px; font-size: 24px; font-weight: bold;">
                                ${formatCurrency(settlement.amount, tripData.currency || 'USD')}
                            </div>
                        </div>
                    `).join('')
                }
            </div>

            <div class="section">
                <h2>👥 Trip Members</h2>
                ${Object.values(memberDetails).map(member => `
                    <div style="display: inline-block; margin: 5px 10px 5px 0; padding: 8px 12px; background: #f1f5f9; border-radius: 20px;">
                        ${member.displayName} ${member.email ? `(${member.email})` : ''}
                    </div>
                `).join('')}
            </div>

            

            <div class="footer">
                <p>This trip summary was automatically generated by <strong>Tripper</strong> 🎯</p>
                <p style="font-size: 12px; margin-top: 15px;">
                    Generated on ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>
        </div>
    </body>
    </html>
`;
}

export async function POST(req: NextRequest) {
  try {
    const { tripId } = await req.json();

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    console.log(`Generating trip summary for trip: ${tripId}`);

    // Get trip details
    const tripRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const tripData = { id: tripSnap.id, ...tripSnap.data() } as any;

    // Get all expenses for this trip
    const expensesQuery = query(
      collection(db, "expenses"),
      where("tripId", "==", tripId),
      orderBy("date", "desc")
    );
    const expensesSnap = await getDocs(expensesQuery);
    const expenses = expensesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expense[];

    // Get member details
    const memberDetails: Record<string, UserDetails> = {};
    if (tripData.members && tripData.members.length > 0) {
      await Promise.all(
        tripData.members.map(async (memberId: string) => {
          try {
            const userRef = doc(db, "users", memberId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              memberDetails[memberId] = {
                uid: memberId,
                displayName: userData.displayName || userData.displayname || 'Unknown User',
                email: userData.email || '',
                photoURL: userData.photoURL || ''
              };
            }
          } catch (error) {
            console.error(`Error fetching user ${memberId}:`, error);
            memberDetails[memberId] = {
              uid: memberId,
              displayName: 'Unknown User',
              email: '',
              photoURL: ''
            };
          }
        })
      );
    }

    // Calculate settlements with improved precision
    const settlements: Settlement[] = [];
    
    // Calculate who owes what with proper rounding
    const balances: Record<string, number> = {};
    
    expenses.forEach(expense => {
      // Add to payer's balance (they paid this amount)
      if (!balances[expense.paidBy]) balances[expense.paidBy] = 0;
      balances[expense.paidBy] += expense.amount;
      
      // Subtract from each person's share (they owe this amount)
      expense.splitBetween.forEach(split => {
        if (!balances[split.userId]) balances[split.userId] = 0;
        balances[split.userId] -= split.amount;
      });
    });

    // Round balances to avoid floating point precision issues
    Object.keys(balances).forEach(userId => {
      balances[userId] = Math.round(balances[userId] * 100) / 100;
    });

    // Generate settlements from balances using improved algorithm
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < -0.01)
      .sort((a, b) => a[1] - b[1]); // Sort by most debt first
    
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0.01)
      .sort((a, b) => b[1] - a[1]); // Sort by most credit first

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const [debtorId, debtAmount] = debtors[debtorIndex];
      const [creditorId, creditAmount] = creditors[creditorIndex];
      
      const settleAmount = Math.min(Math.abs(debtAmount), creditAmount);
      
      if (settleAmount > 0.01) { // Only create settlement if amount is significant
        settlements.push({
          fromUserId: debtorId,
          toUserId: creditorId,
          amount: Math.round(settleAmount * 100) / 100 // Round to 2 decimal places
        });
        
        // Update balances
        debtors[debtorIndex][1] += settleAmount;
        creditors[creditorIndex][1] -= settleAmount;
      }
      
      // Move to next debtor or creditor when their balance is settled
      if (Math.abs(debtors[debtorIndex][1]) < 0.01) {
        debtorIndex++;
      }
      if (creditors[creditorIndex][1] < 0.01) {
        creditorIndex++;
      }
    }

    // Calculate statistics
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averagePerPerson = Object.keys(memberDetails).length > 0 
      ? totalAmount / Object.keys(memberDetails).length 
      : 0;

    const statistics = {
      totalAmount,
      averagePerPerson,
      totalExpenses: expenses.length,
      memberCount: Object.keys(memberDetails).length
    };

    // Generate PDF attachment with comprehensive details
    console.log('📊 Generating comprehensive PDF report...');
    
    let pdfBuffer: Buffer | null = null;
    let fileName: string | null = null;
    
    try {
      // Calculate detailed statistics
      const expensesByCategory: Record<string, { count: number; total: number }> = {};
      const expensesByMember: Record<string, { count: number; total: number }> = {};
      const dailyBreakdown: Record<string, number> = {};
      
      expenses.forEach(expense => {
        // Category breakdown
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = { count: 0, total: 0 };
        }
        expensesByCategory[expense.category].count++;
        expensesByCategory[expense.category].total += expense.amount;
        
        // Member breakdown
        const memberName = memberDetails[expense.paidBy]?.displayName || expense.paidBy;
        if (!expensesByMember[memberName]) {
          expensesByMember[memberName] = { count: 0, total: 0 };
        }
        expensesByMember[memberName].count++;
        expensesByMember[memberName].total += expense.amount;
        
        // Daily breakdown
        const dateKey = expense.date?.toDate ? 
          expense.date.toDate().toLocaleDateString() : 
          (expense.date ? new Date(expense.date).toLocaleDateString() : 'Unknown');
        if (!dailyBreakdown[dateKey]) {
          dailyBreakdown[dateKey] = 0;
        }
        dailyBreakdown[dateKey] += expense.amount;
      });
      
      // Find most expensive expense
      const mostExpensiveExpense = expenses.length > 0 ? 
        expenses.reduce((max, expense) => expense.amount > max.amount ? expense : max) :
        { description: 'No expenses', amount: 0, date: 'N/A' };

      // Prepare detailed PDF data
      const pdfExpenses: PDFExpense[] = expenses.map(expense => {
        const formatExpenseDate = (date: any) => {
          try {
            if (date?.toDate) {
              return date.toDate().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            } else if (date) {
              return new Date(date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            }
            return 'N/A';
          } catch (error) {
            return 'N/A';
          }
        };

        return {
          date: formatExpenseDate(expense.date),
          description: expense.description || expense.name,
          amount: Math.round(expense.amount * 100) / 100,
          category: expense.category,
          paidBy: memberDetails[expense.paidBy]?.displayName || expense.paidBy,
          splitBetween: expense.splitBetween.map(split => ({
            name: memberDetails[split.userId]?.displayName || split.userId,
            amount: Math.round(split.amount * 100) / 100,
            percentage: Math.round((split.amount / expense.amount) * 10000) / 100 // Round percentage to 2 decimal places
          })),
          currency: expense.currency || tripData.currency || 'USD',
          createdBy: memberDetails[expense.createdBy.uid]?.displayName || expense.createdBy.displayName || 'Unknown',
          createdAt: expense.createdAt?.toDate ? expense.createdAt.toDate().toLocaleString() : 'Unknown'
        };
      });

      const pdfSettlements: PDFSettlement[] = settlements.map(settlement => ({
        from: memberDetails[settlement.fromUserId]?.displayName || settlement.fromUserId,
        to: memberDetails[settlement.toUserId]?.displayName || settlement.toUserId,
        amount: settlement.amount,
        currency: tripData.currency || 'USD',
        description: `Settlement for shared expenses`
      }));

      const pdfMembers: PDFMember[] = Object.values(memberDetails).map(member => {
        const memberBalance = balances[member.uid] || 0;
        const memberExpenses = expenses.filter(exp => exp.paidBy === member.uid);
        const totalPaid = memberExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalOwed = expenses.reduce((sum, exp) => {
          const split = exp.splitBetween.find(s => s.userId === member.uid);
          return sum + (split ? split.amount : 0);
        }, 0);

        return {
          name: member.displayName,
          email: member.email,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalOwed: Math.round(totalOwed * 100) / 100,
          balance: Math.round(memberBalance * 100) / 100,
          currency: tripData.currency || 'USD',
          expenseCount: memberExpenses.length,
          joinedDate: 'Member since trip start' // You might want to track this
        };
      });

      const pdfData: PDFTripData = {
        tripName: tripData.name,
        startDate: tripData.startDate?.toDate ? tripData.startDate.toDate().toLocaleDateString() : 'N/A',
        endDate: tripData.endDate?.toDate ? tripData.endDate.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
        status: tripData.status || 'completed',
        totalExpenses: Math.round(totalAmount * 100) / 100,
        currency: tripData.currency || 'USD',
        expenses: pdfExpenses,
        settlements: pdfSettlements,
        members: pdfMembers,
        statistics: {
          totalAmount: Math.round(totalAmount * 100) / 100,
          averagePerPerson: Math.round(averagePerPerson * 100) / 100,
          expensesByCategory,
          expensesByMember,
          mostExpensiveExpense: {
            description: (mostExpensiveExpense as any).description || (mostExpensiveExpense as any).name || 'No expenses',
            amount: Math.round(mostExpensiveExpense.amount * 100) / 100,
            date: (mostExpensiveExpense as any).date?.toDate ? (mostExpensiveExpense as any).date.toDate().toLocaleDateString() : 'Unknown'
          },
          dailyBreakdown
        }
      };

      pdfBuffer = generateTripSummaryPDF(pdfData);
      fileName = `${tripData.name.replace(/[^a-zA-Z0-9]/g, '_')}_Trip_Report_${pdfData.endDate}.pdf`;
      
      // Check file size (limit to 10MB for email attachment)
      const fileSizeMB = pdfBuffer.length / (1024 * 1024);
      if (fileSizeMB > 10) {
        console.warn(`⚠️ PDF file size (${fileSizeMB.toFixed(2)}MB) exceeds email limit, skipping attachment`);
        pdfBuffer = null;
        fileName = null;
      } else {
        console.log('✅ PDF report generated:', fileName, `(${fileSizeMB.toFixed(2)}MB)`);
      }
    } catch (pdfError) {
      console.error('❌ Failed to generate PDF report:', pdfError);
      pdfBuffer = null;
      fileName = null;
    }

    // Generate HTML email
    const htmlContent = generateTripSummaryHTML(
      tripData,
      expenses,
      settlements,
      memberDetails,
      statistics,
      !!(pdfBuffer && fileName) // Pass true if PDF attachment is available
    );

    // Send emails to all members
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: "Email service not configured - Missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    console.log('📧 Resend API Key configured, initializing...');
    const resend = new Resend(RESEND_API_KEY);
    const emailResults = [];

    console.log(`📧 Preparing to send emails to ${Object.values(memberDetails).length} members:`);
    Object.values(memberDetails).forEach(member => {
      console.log(`  - ${member.displayName} (${member.email})`);
    });

    for (const member of Object.values(memberDetails)) {
      if (member.email && member.email.trim()) {
        try {
          console.log(`📧 Sending trip summary to: ${member.email}`);
          
          // Prepare email configuration
          const emailConfig: any = {
            from: "Tripper Team <noreply@resend.dev>",
            to: [member.email],
            subject: `🎯 Trip Summary: ${tripData.name} - Complete Expense Report`,
            html: htmlContent,
          };

          // Add PDF attachment if generated successfully
          if (pdfBuffer && fileName) {
            emailConfig.attachments = [
              {
                filename: fileName,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ];
          }

          const result = await resend.emails.send(emailConfig);

          emailResults.push({
            email: member.email,
            name: member.displayName,
            success: true,
            messageId: result.data?.id,
            result: result
          });

          console.log(`✅ Trip summary sent successfully to ${member.email}, Message ID: ${result.data?.id}`);
        } catch (error) {
          console.error(`❌ Failed to send trip summary to ${member.email}:`, error);
          emailResults.push({
            email: member.email,
            name: member.displayName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error
          });
        }
      } else {
        console.log(`⚠️ Skipping member ${member.displayName} - no valid email address`);
        emailResults.push({
          email: member.email || 'No email',
          name: member.displayName,
          success: false,
          error: 'No valid email address provided'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Trip summary emails sent successfully",
      emailResults,
      statistics: {
        totalSent: emailResults.filter(r => r.success).length,
        totalFailed: emailResults.filter(r => !r.success).length,
        tripSummary: {
          totalExpenses: expenses.length,
          totalAmount: totalAmount,
          settlementsNeeded: settlements.length,
          membersCount: Object.keys(memberDetails).length
        }
      }
    });

  } catch (error) {
    console.error("Error sending trip summary:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send trip summary" },
      { status: 500 }
    );
  }
}
