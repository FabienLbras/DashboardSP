import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description?: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://eqgvffm7w8.execute-api.eu-north-1.amazonaws.com/prod")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data); // assumes data is an array
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching transactions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading transactions...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>
      <table className="min-w-full table-auto border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Amount (€)</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Authorisation Reference</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="p-2 border">{tx.date}</td>
              <td className="p-2 border">€{tx.amount.toFixed(2)}</td>
              <td className="p-2 border">{tx.description || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}