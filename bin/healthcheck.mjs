#!/usr/bin/env node
import process from "node:process";

try {
  const origin = process.argv[2] ?? "http://localhost:3000";
  const response = await fetch(`${origin}/api/healthz`);
  if (response.ok) process.exit(0);
} catch (error) {
  console.error("Healthcheck failed", error);
  process.exit(1);
}
