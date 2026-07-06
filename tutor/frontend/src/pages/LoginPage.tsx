import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/tutor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h1 className="mb-6 text-2xl font-bold">ยินดีต้อนรับกลับ</h1>
      <form onSubmit={submit} className="space-y-4">
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
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-sky-600 py-2 font-medium hover:bg-sky-500">
          เข้าสู่ระบบ
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-400">
        ยังไม่มีบัญชี? <Link to="/register" className="text-sky-400">สมัครสมาชิก</Link>
      </p>
    </div>
  );
}
