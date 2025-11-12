interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "transfer";
  amount: number;
  username?: string; // For transfer transactions
  createdAt: string;
}

export default Transaction;

