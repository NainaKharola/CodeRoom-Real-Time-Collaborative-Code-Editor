const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RUNS_DIR = path.join(__dirname, '..', 'scratch', 'runs');

// Ensure base temp runner directory exists
if (!fs.existsSync(RUNS_DIR)) {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
}

/**
 * Executes user code inside a spawned process with constraints.
 */
/**
 * Executes user code inside a spawned process with constraints.
 */
function runCode(language, code, input = '') {
  return new Promise((resolve) => {
    let ext = '';
    let command = '';
    let args = [];
    let needsCompile = false;
    let javaClassName = '';

    switch (language) {
      case 'c':
        ext = 'c';
        command = 'gcc';
        needsCompile = true;
        break;
      case 'cpp':
        ext = 'cpp';
        command = 'g++';
        needsCompile = true;
        break;
      case 'java':
        ext = 'java';
        command = 'javac';
        needsCompile = true;
        // Parse public class or any class from Java code
        const classMatch = code.match(/public\s+class\s+(\w+)/) || code.match(/class\s+(\w+)/);
        javaClassName = classMatch ? classMatch[1] : 'Main';
        break;
      case 'python':
        ext = 'py';
        command = process.platform === 'win32' ? 'python' : 'python3';
        break;
      case 'javascript':
        ext = 'js';
        command = 'node';
        break;
      case 'typescript':
        ext = 'ts';
        command = 'ts-node';
        break;
      case 'csharp':
        ext = 'cs';
        command = 'csc';
        needsCompile = true;
        break;
      case 'go':
        ext = 'go';
        command = 'go';
        break;
      case 'rust':
        ext = 'rs';
        command = 'rustc';
        needsCompile = true;
        break;
      default:
        return resolve({ 
          success: false, 
          compileError: `Execution unavailable for this language (${language}) in the current environment.` 
        });
    }

    // Generate unique temp sandbox dir
    const runId = crypto.randomBytes(16).toString('hex');
    const sandboxDir = path.join(RUNS_DIR, runId);
    fs.mkdirSync(sandboxDir, { recursive: true });

    // Java naming exception
    const filename = language === 'java' ? `${javaClassName}.java` : `main.${ext}`;
    const sourceFile = path.join(sandboxDir, filename);
    fs.writeFileSync(sourceFile, code);

    if (needsCompile) {
      let compileCmd = command;
      let compileArgs = [];
      let execFile = '';
      let execArgs = [];

      if (language === 'java') {
        compileCmd = 'javac';
        compileArgs = [sourceFile];
        execFile = 'java';
        execArgs = [javaClassName];
      } else if (language === 'c' || language === 'cpp') {
        compileCmd = command;
        execFile = path.join(sandboxDir, process.platform === 'win32' ? 'main.exe' : 'main');
        compileArgs = [sourceFile, '-o', execFile];
        execArgs = [];
      } else if (language === 'rust') {
        compileCmd = 'rustc';
        execFile = path.join(sandboxDir, process.platform === 'win32' ? 'main.exe' : 'main');
        compileArgs = [sourceFile, '-o', execFile];
        execArgs = [];
      } else if (language === 'csharp') {
        compileCmd = 'csc';
        execFile = path.join(sandboxDir, 'main.exe');
        compileArgs = [sourceFile, '-out:' + execFile];
        // Mono/dotnet execution handler
        execFile = process.platform === 'win32' ? execFile : 'mono';
        execArgs = process.platform === 'win32' ? [] : [path.join(sandboxDir, 'main.exe')];
      }

      const compiler = spawn(compileCmd, compileArgs);
      
      let compileErr = '';
      compiler.stderr.on('data', (data) => {
        compileErr += data.toString();
      });
      compiler.stdout.on('data', (data) => {
        compileErr += data.toString();
      });

      compiler.on('close', (code) => {
        if (code !== 0) {
          cleanupDir(sandboxDir);
          return resolve({ 
            success: false, 
            compileError: `${language.toUpperCase()} Compilation Error:\n${compileErr}` 
          });
        }
        
        // Execute compiled binary/class
        executeSandbox(execFile, execArgs, input, sandboxDir, resolve);
      });

      compiler.on('error', (err) => {
        cleanupDir(sandboxDir);
        if (err.code === 'ENOENT') {
          resolve({ 
            success: false, 
            compileError: `Execution unavailable: compiler/runtime for ${language.toUpperCase()} (${compileCmd}) is not installed on this server.` 
          });
        } else {
          resolve({ success: false, compileError: `Compiler trigger failed: ${err.message}` });
        }
      });
      return;
    }

    // For interpreted (js, py, go, ts)
    if (language === 'go') {
      args = ['run', sourceFile];
    } else {
      args.push(sourceFile);
    }
    executeSandbox(command, args, input, sandboxDir, resolve);
  });
}

function executeSandbox(command, args, input, sandboxDir, resolve) {
  const startTime = process.hrtime();
  let child;
  try {
    child = spawn(command, args, {
      env: { TMPDIR: sandboxDir }, // restrict temp variables
      cwd: sandboxDir
    });
  } catch (err) {
    cleanupDir(sandboxDir);
    return resolve({ success: false, stderr: `System execution failed: ${err.message}`, exitCode: -1 });
  }

  let stdout = '';
  let stderr = '';
  let timedOut = false;

  // Prevent EPIPE/write crashes on child.stdin
  if (child.stdin) {
    child.stdin.on('error', (err) => {
      console.log('child.stdin stream write error (safely ignored):', err.message);
    });
  }

  // Max output limit buffer (50KB)
  const MAX_OUTPUT = 50 * 1024;

  child.stdout.on('data', (data) => {
    if (stdout.length < MAX_OUTPUT) {
      stdout += data.toString();
    }
  });

  child.stderr.on('data', (data) => {
    if (stderr.length < MAX_OUTPUT) {
      stderr += data.toString();
    }
  });

  // Handle spawn execution errors (e.g. interpreter not installed)
  child.on('error', (err) => {
    cleanupDir(sandboxDir);
    if (err.code === 'ENOENT') {
      resolve({ 
        success: false, 
        stderr: `Execution unavailable for this language in the current environment (${command} is not installed).`,
        exitCode: 127
      });
    } else {
      resolve({ success: false, stderr: `Execution trigger error: ${err.message}`, exitCode: -1 });
    }
  });

  // Set timeout (4 seconds execution limit)
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill('SIGKILL');
  }, 4000);

  // Write stdin with a small delay for Windows process stream readiness
  setTimeout(() => {
    if (child && child.stdin && child.stdin.writable) {
      if (input !== undefined && input !== null) {
        child.stdin.write(input);
      }
      child.stdin.end();
    }
  }, 50);

  child.on('close', (code) => {
    clearTimeout(timeout);
    cleanupDir(sandboxDir);

    const diff = process.hrtime(startTime);
    const executionTimeMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);

    if (timedOut) {
      return resolve({ 
        success: false, 
        timedOut: true,
        stderr: 'Process exited due to timeout (Time limit exceeded: 4000ms)',
        exitCode: null,
        executionTime: 4000
      });
    }

    resolve({
      success: code === 0,
      stdout,
      stderr,
      exitCode: code,
      executionTime: executionTimeMs
    });
  });
}

function cleanupDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('Failed to clean up sandbox directory:', e.message);
  }
}

module.exports = { runCode };
