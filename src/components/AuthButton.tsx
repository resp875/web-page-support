"use client";
import React, { useEffect, useState } from "react";

interface User {
  name?: string;
  picture?: string;
  email?: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user || null);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return null;
  
  if (!user) {
    return (
      <a href="/api/auth/login" className="underline text-sm">
        Log in
      </a>
    );
  }
  
  return (
    <div className="flex items-center gap-3 text-sm">
      {user.picture && (
        <img src={user.picture} alt={user.name || "user"} className="w-8 h-8 rounded-full" />
      )}
      <span>{user.name}</span>
      <a href="/api/auth/logout" className="underline">
        Log out
      </a>
    </div>
  );
}

