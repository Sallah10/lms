'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [form, setForm] = useState({ name: '', email: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    alert('Profile updated!');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input name="name" placeholder="Name" className="border p-2 rounded" onChange={handleChange} />
        <input name="email" placeholder="Email" className="border p-2 rounded" onChange={handleChange} />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">Update</button>
      </form>
    </div>
  );
}
