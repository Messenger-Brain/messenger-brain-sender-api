#!/usr/bin/env node
/**
 * Script to kill process using a specific port
 * Usage: node scripts/kill-port.js [port]
 */

const { execSync } = require('child_process');

const port = process.argv[2] || process.env.PORT || 9000;

console.log(`🔍 Checking for processes on port ${port}...`);

try {
  // Find process using the port
  const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
  
  if (result) {
    const pids = result.split('\n');
    console.log(`⚠️  Found ${pids.length} process(es) using port ${port}`);
    
    pids.forEach(pid => {
      try {
        console.log(`   Killing process ${pid}...`);
        execSync(`kill -9 ${pid}`);
        console.log(`   ✅ Process ${pid} killed`);
      } catch (err) {
        console.error(`   ❌ Failed to kill process ${pid}`);
      }
    });
    
    console.log(`\n✅ Port ${port} is now free`);
  } else {
    console.log(`✅ Port ${port} is already free`);
  }
} catch (error) {
  // No process found on port (lsof returns error code if nothing found)
  console.log(`✅ Port ${port} is free`);
}

