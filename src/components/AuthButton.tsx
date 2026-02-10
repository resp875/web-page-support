"use client";
import React from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function AuthButton() {
  const { user, error, isLoading } = useUser();
  if (isLoading) return null;
  if (!user) {
    return (
      <a href="/auth/login" className="underline text-sm">
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
      <a href="/auth/logout" className="underline">
        Log out
      </a>
    </div>
  );
}