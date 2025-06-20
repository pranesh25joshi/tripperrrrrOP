import { create } from "zustand";
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export interface ExpenseShare {
  userId: string;
  amount: number;
}


export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  paidBy: string; // User ID
  splitBetween: ExpenseShare[];
  date: Timestamp;
  category?: string;
  notes?: string;
}

export interface ExpenseInput {
  tripId: string;
  description: string;
  amount: number;
  paidBy: string; // User ID
  splitBetween: ExpenseShare[];
  category?: string;
  notes?: string;
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  addExpense: (expense: ExpenseInput) => Promise<string | undefined>;
  fetchExpenses: (tripId: string) => Promise<void>;
  calculateSimpleSettlements: (tripId: string) => Promise<Settlement[]>;
  calculateOptimizedSettlements: (tripId: string) => Promise<Settlement[]>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  addExpense: async (expenseInput: ExpenseInput) => {
    try {
      set({ isLoading: true, error: null });
      
      const expenseRef = await addDoc(collection(db, "expenses"), {
        ...expenseInput,
        date: serverTimestamp()
      });
      
      // Fetch the created expense
      const expenseSnap = await getDoc(expenseRef);
      const newExpense = {
        id: expenseSnap.id,
        ...expenseSnap.data()
      } as Expense;
      
      set(state => ({ 
        expenses: [...state.expenses, newExpense],
        isLoading: false
      }));
      
      return expenseRef.id;
    } catch (error) {
      console.error("Error adding expense:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to add expense",
        isLoading: false
      });
    }
  },
  
  fetchExpenses: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const expensesQuery = query(
        collection(db, "expenses"),
        where("tripId", "==", tripId),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(expensesQuery);
      const expenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        expenses.push({
          id: doc.id,
          ...doc.data()
        } as Expense);
      });
      
      set({ expenses, isLoading: false });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch expenses",
        isLoading: false
      });
    }
  },
  

  calculateSimpleSettlements: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await get().fetchExpenses(tripId);
      const expenses = get().expenses;
      
      const debts: Record<string, Record<string, number>> = {};
      
      expenses.forEach(expense => {
        const paidBy = expense.paidBy;
        
        expense.splitBetween.forEach(share => {
          const owedBy = share.userId;
          const amount = share.amount;
          
          // Skip if the person paid for themselves
          if (owedBy === paidBy) return;
          
          // Initialize objects if needed
          if (!debts[owedBy]) debts[owedBy] = {};
          if (!debts[owedBy][paidBy]) debts[owedBy][paidBy] = 0;
          
          // Add to debt - "owedBy owes paidBy this amount"
          debts[owedBy][paidBy] += amount;
        });
      });
      
      const settlements: Settlement[] = [];
      
      // Convert the debt structure to an array
      Object.keys(debts).forEach(debtor => {
        Object.keys(debts[debtor]).forEach(creditor => {
          const amount = Math.round(debts[debtor][creditor] * 100) / 100;
          
          if (amount > 0) {
            settlements.push({
              fromUserId: debtor,
              toUserId: creditor,
              amount: amount
            });
          }
        });
      });
      
      set({ isLoading: false });
      return settlements;
    } catch (error) {
      console.error("Error calculating settlements:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Failed to calculate settlements" 
      });
      return [];
    }
  },
  

  calculateOptimizedSettlements: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await get().fetchExpenses(tripId);
      const expenses = get().expenses;
      
      const balances: Record<string, number> = {};
      
      expenses.forEach(expense => {
        // Add what the payer paid
        balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
        
        // Subtract what each person owes
        expense.splitBetween.forEach(share => {
          balances[share.userId] = (balances[share.userId] || 0) - share.amount;
        });
      });
      
      const settlements: Settlement[] = [];
      const debtors: {id: string, amount: number}[] = [];
      const creditors: {id: string, amount: number}[] = [];
      
      Object.entries(balances).forEach(([userId, balance]) => {
        if (balance < 0) {
          debtors.push({ id: userId, amount: Math.abs(balance) });
        } else if (balance > 0) {
          creditors.push({ id: userId, amount: balance });
        }
      });
      
      debtors.sort((a, b) => b.amount - a.amount);
      creditors.sort((a, b) => b.amount - a.amount);
      
      // Create settlements
      let i = 0; // debtor index
      let j = 0; // creditor index
      
      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        
        const amount = Math.min(debtor.amount, creditor.amount);
        
        if (amount > 0) {
          settlements.push({
            fromUserId: debtor.id,
            toUserId: creditor.id,
            amount: Math.round(amount * 100) / 100 
          });
        }
        
        // Reduce balances
        debtor.amount -= amount;
        creditor.amount -= amount;
        
        // Move to next person if their balance is settled
        if (debtor.amount < 0.01) i++; // Using 0.01 to avoid floating point issues
        if (creditor.amount < 0.01) j++;
      }
      
      set({ isLoading: false });
      return settlements;
    } catch (error) {
      console.error("Error calculating optimized settlements:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to calculate settlements",
        isLoading: false
      });
      return [];
    }
  }
}));