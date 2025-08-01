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
  name: string;
  description: string;
  amount: number;
  currency: string;
  paidBy?: string; // User ID
  splitBetween?: ExpenseShare[];
  date: Timestamp;
  category: string;
  createdBy: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  createdAt?: Timestamp;
}

export interface ExpenseInput {
  tripId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  paidBy?: string;
  splitBetween?: ExpenseShare[];
  createdBy: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
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

// Helper to get expenses from localStorage
const getStoredExpenses = (tripId: string): Expense[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedData = localStorage.getItem(`trip_expenses_${tripId}`);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error("Error retrieving expenses from localStorage:", error);
    return [];
  }
};

// Helper to store expenses in localStorage
const storeExpenses = (tripId: string, expenses: Expense[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`trip_expenses_${tripId}`, JSON.stringify(expenses));
  } catch (error) {
    console.error("Error storing expenses in localStorage:", error);
  }
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  addExpense: async (expenseInput: ExpenseInput) => {
    try {
      set({ isLoading: true, error: null });
      
      // Convert date string to Timestamp
      const expenseToSave = {
        ...expenseInput,
        date: Timestamp.fromDate(new Date(expenseInput.date)),
        createdAt: Timestamp.now()
      };
      
      const expenseRef = await addDoc(collection(db, "expenses"), expenseToSave);
      
      // Fetch the created expense
      const expenseSnap = await getDoc(expenseRef);
      const newExpense = {
        id: expenseSnap.id,
        ...expenseSnap.data()
      } as Expense;
      
      const updatedExpenses = [newExpense, ...get().expenses];
      
      // Update localStorage
      storeExpenses(expenseInput.tripId, updatedExpenses);
      
      set({ 
        expenses: updatedExpenses,
        isLoading: false
      });
      
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
    if (!tripId) {
      console.error("Cannot fetch expenses: No tripId provided");
      return;
    }
    
    // First, try to load from localStorage to show data immediately
    const cachedExpenses = getStoredExpenses(tripId);
    if (cachedExpenses.length > 0) {
      console.log(`ExpenseStore: Loaded ${cachedExpenses.length} expenses from cache for trip ${tripId}`);
      set({ expenses: cachedExpenses, isLoading: true });
    } else {
      set({ isLoading: true, error: null });
    }
    
    try {
      console.log(`ExpenseStore: Starting expense fetch for trip ${tripId}`);
      
      // Try the indexed query first
      const indexedQuery = query(
        collection(db, "expenses"),
        where("tripId", "==", tripId),
        orderBy("date", "desc")
      );
      
      let querySnapshot;
      let expenses: Expense[] = [];
      
      try {
        // Attempt to use the preferred query with indexing
        querySnapshot = await getDocs(indexedQuery);
      } catch (indexError) {
        console.log("Index not ready yet, falling back to basic query");
        
        // If index error, fall back to a simple query without ordering
        const fallbackQuery = query(
          collection(db, "expenses"),
          where("tripId", "==", tripId)
        );
        
        querySnapshot = await getDocs(fallbackQuery);
      }
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push({
          id: doc.id,
          ...data
        } as Expense);
      });
      
      // If we had to use the fallback query, manually sort the results
      // to simulate the orderBy("date", "desc") behavior
      expenses.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date?.toDate?.();
        const dateB = b.date instanceof Date ? b.date : b.date?.toDate?.();
        
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
      
      console.log(`ExpenseStore: Fetched ${expenses.length} expenses for trip ${tripId}`);
      
      // Store expenses in localStorage for persistence
      storeExpenses(tripId, expenses);
      
      set({ expenses, isLoading: false });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      
      // Check specifically for the index-related error
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch expenses";
      const isIndexError = errorMsg.includes("requires an index") || 
                           errorMsg.includes("FAILED_PRECONDITION") ||
                           errorMsg.includes("https://console.firebase.google.com");
      
      // If we have cached data, keep using it rather than showing an error
      if (cachedExpenses.length > 0) {
        console.log(`ExpenseStore: Network fetch failed, using ${cachedExpenses.length} cached expenses`);
        set({ 
          error: isIndexError ? 
            "Firebase index is being created. This may take a few minutes. Your data will appear soon." : 
            null,
          isLoading: false,
          expenses: cachedExpenses
        });
      } else {
        set({ 
          error: isIndexError ? 
            "Firebase index is being created. This may take a few minutes. Please try again soon." : 
            errorMsg,
          isLoading: false,
          expenses: [] // Reset expenses on error when no cache exists
        });
      }
    }
  },
  

  calculateSimpleSettlements: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await get().fetchExpenses(tripId);
      const expenses = get().expenses;
      
      const debts: Record<string, Record<string, number>> = {};
      
      expenses.forEach(expense => {
        const paidBy = expense.paidBy || expense.createdBy.uid;
        
        // Skip expenses without split information
        if (!expense.splitBetween || expense.splitBetween.length === 0) return;
        
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
        const paidBy = expense.paidBy || expense.createdBy.uid;
        
        // Add what the payer paid
        balances[paidBy] = (balances[paidBy] || 0) + expense.amount;
        
        // Skip expenses without split information
        if (!expense.splitBetween || expense.splitBetween.length === 0) return;
        
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