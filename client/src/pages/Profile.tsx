import { useState } from "react";
export default function Profile() {
  const [user] = useState({ name: "User", status: "Verified" });
  return <div dir="rtl" className="min-h-screen bg-slate-50 p-4"><div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow"><h1 className="text-2xl font-black">My Profile</h1><p className="mt-2">Hello {user.name}</p><p className="mt-1 text-green-600">Verified</p><p className="mt-2 text-sm text-slate-500">Your data is from Didit verification.</p></div></div>;
}
