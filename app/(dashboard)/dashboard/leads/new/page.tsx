'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push('/dashboard/leads');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Lead</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input name="name" placeholder="Name" className="border p-2 rounded" onChange={handleChange} />
        <input name="email" placeholder="Email" className="border p-2 rounded" onChange={handleChange} />
        <input name="phone" placeholder="Phone" className="border p-2 rounded" onChange={handleChange} />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Create</button>
      </form>
    </div>
  );
}
