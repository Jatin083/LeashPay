
"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  ShieldCheck,
  Receipt,
  Settings,
  Search,
  Send,
  Wallet,
  LockKeyhole,
  ArrowUpRight,
  Sparkles,
  Headphones,
  Monitor,
  Watch,
  CheckCircle2,
  CircleDollarSign,
} from "lucide-react";

const products = [
  { name: "Soundcore Life Q30", category: "Headphones", price: 2499, rating: 4.6, icon: Headphones },
  { name: "Sony WH-CH520", category: "Headphones", price: 4290, rating: 4.5, icon: Headphones },
  { name: "JBL Tune 770NC", category: "Headphones", price: 5999, rating: 4.7, icon: Headphones },
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("4000");
  const [category, setCategory] = useState("Electronics");
  const [approval, setApproval] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hey! I'm your LeashPay shopping assistant. Tell me what you need, and I'll find the best options within your spending mandate.",
    },
  ]);

  function sendMessage() {
    if (!message.trim()) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: message },
    ]);
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-[#090b10] text-white flex">
      <aside className="hidden md:flex w-64 border-r border-white/10 p-6 flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl">
            L
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">LeashPay</h1>
            <p className="text-xs text-gray-500">AI Shopping Agent</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
          Workspace
        </p>

        <nav className="space-y-2">
          {[
            [LayoutDashboard, "Dashboard", true],
            [ShoppingBag, "Shop", false],
            [ShieldCheck, "Spending Mandate", false],
            [Receipt, "Orders", false],
          ].map(([Icon, label, active]: any) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm ${
                active
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
              <ShieldCheck size={17} />
              Protected shopping
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your agent cannot spend beyond your approved mandate.
            </p>
          </div>
          <button className="flex items-center gap-3 text-gray-400 text-sm p-3">
            <Settings size={18} /> Settings
          </button>
        </div>
      </aside>

      <section className="flex-1 min-w-0 p-5 md:p-9">
        <header className="flex justify-between items-center mb-9">
          <div>
            <p className="text-sm text-gray-500">Monday, November 9, 2026</p>
            <h2 className="text-2xl font-bold mt-1">Your dashboard</h2>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-sm text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            Sandbox mode
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
          <div className="rounded-2xl border border-white/10 bg-[#11151e] p-5">
            <div className="flex justify-between text-gray-400 text-sm">
              Spending limit <Wallet size={18} />
            </div>
            <h3 className="text-3xl font-bold mt-4">₹{Number(budget).toLocaleString("en-IN")}</h3>
            <p className="text-xs text-gray-500 mt-2">Your current mandate budget</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11151e] p-5">
            <div className="flex justify-between text-gray-400 text-sm">
              Approval policy <LockKeyhole size={18} />
            </div>
            <h3 className="text-2xl font-bold mt-4">
              {approval ? "Every order" : "Not required"}
            </h3>
            <p className="text-xs text-gray-500 mt-2">Human payment authorization</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11151e] p-5">
            <div className="flex justify-between text-gray-400 text-sm">
              Policy status <ShieldCheck size={18} />
            </div>
            <h3 className="text-2xl font-bold mt-4 text-green-400">Active</h3>
            <p className="text-xs text-gray-500 mt-2">Demo interface — enforcement not connected yet</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-3 rounded-2xl border border-white/10 bg-[#11151e] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                <Sparkles size={21} />
              </div>
              <div>
                <h3 className="font-semibold">Shopping assistant</h3>
                <p className="text-xs text-gray-500">Your personal AI shopping agent</p>
              </div>
            </div>

            <div className="p-5 min-h-64 space-y-4">
              {messages.map((item, index) => (
                <div
                  key={index}
                  className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    item.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white/[0.06] text-gray-300"
                  }`}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2 bg-[#090b10] rounded-xl border border-white/10 p-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="What would you like to shop for?"
                  className="flex-1 min-w-0 bg-transparent px-2 outline-none text-sm"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-500 rounded-lg p-3"
                >
                  <Send size={17} />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                AI responses will be connected in the next development stage.
              </p>
            </div>
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-[#11151e] p-5">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="text-blue-400" size={20} />
              <h3 className="font-semibold">Spending mandate</h3>
            </div>

            <label className="text-sm text-gray-400">Maximum budget (INR)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full mt-2 mb-5 rounded-xl border border-white/10 bg-[#090b10] p-3 outline-none focus:border-blue-500"
            />

            <label className="text-sm text-gray-400">Allowed category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-2 mb-5 rounded-xl border border-white/10 bg-[#090b10] p-3 outline-none"
            >
              <option>Electronics</option>
              <option>Fashion</option>
              <option>Home</option>
              <option>All categories</option>
            </select>

            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm font-medium">Require my approval</p>
                <p className="text-xs text-gray-500 mt-1">Before every payment</p>
              </div>
              <button
                onClick={() => setApproval(!approval)}
                className={`w-12 h-6 rounded-full p-1 transition ${approval ? "bg-blue-600" : "bg-gray-700"}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white transition ${approval ? "translate-x-6" : ""}`} />
              </button>
            </div>

            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 mb-5">
              <p className="text-xs text-blue-300 leading-relaxed">
                <LockKeyhole size={14} className="inline mr-2" />
                Interface settings only. Server-side policy enforcement will be implemented separately.
              </p>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 font-semibold text-sm">
              Save mandate
            </button>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-[#11151e] p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-semibold">Product discovery</h3>
              <p className="text-xs text-gray-500 mt-1">Example products from our demo catalog</p>
            </div>
            <Search size={19} className="text-gray-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 border-b border-white/10">
                <tr>
                  <th className="py-3">Product</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th>Budget check</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.name} className="border-b border-white/5">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <product.icon size={19} className="text-blue-400" />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>₹{product.price.toLocaleString("en-IN")}</td>
                    <td>⭐ {product.rating}</td>
                    <td>
                      {product.price <= Number(budget) ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle2 size={15} /> Within budget
                        </span>
                      ) : (
                        <span className="text-red-400">Over budget</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-gray-600">
          LeashPay · AI-powered shopping with human-controlled payments
        </footer>
      </section>
    </main>
  );
}
