import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(email, fullName, password);
      navigate("/tutor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h1 className="mb-6 text-2xl font-bold">สร้างบัญชีใหม่</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="text"
          placeholder="ชื่อ-นามสกุล"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2"
          required
        />
        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-sky-600 py-2 font-medium hover:bg-sky-500">
          สมัครสมาชิก
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-400">
        มีบัญชีอยู่แล้ว? <Link to="/login" className="text-sky-400">เข้าสู่ระบบ</Link>
      </p>
    </div>
  );
}
