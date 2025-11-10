// Piston API Service Implementation
// This service handles code execution using the Piston API (https://emkc.org/api/v2/piston)

interface PistonLanguage {
  name: string;
  version: string;
  aliases: string[];
}

interface PistonRequest {
  language: string;
  version: string;
  files: Array<{
    name: string;
    content: string;
  }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

interface PistonResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: null | string;
    output: string;
    message?: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: null | string;
    output: string;
  };
  language: string;
  version: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
  hidden?: boolean;
}

interface ExecutionResult {
  testCase: TestCase;
  output: string;
  error: string;
  exitCode: number;
  executionTime: number;
  memoryUsage: number;
  passed: boolean;
}

class PistonService {
  private baseURL: string = 'https://emkc.org/api/v2/piston';
  private supportedLanguages: PistonLanguage[] = [];

  // Language mappings for Piston API
  private languageMap: Record<string, { name: string; version: string }> = {
    python: { name: 'python', version: '3.10.0' },
    java: { name: 'java', version: '15.0.2' },
    c: { name: 'c', version: '10.2.1' },
    cpp: { name: 'cpp', version: '10.2.1' },
    javascript: { name: 'javascript', version: '18.15.0' },
    go: { name: 'go', version: '1.19.5' },
    rust: { name: 'rust', version: '1.68.2' },
    php: { name: 'php', version: '8.1.16' },
    ruby: { name: 'ruby', version: '3.2.1' },
    typescript: { name: 'typescript', version: '5.0.3' },
  };

  constructor() {
    this.initializeLanguages();
  }

  private async initializeLanguages(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/runtimes`);
      const data = await response.json();
      this.supportedLanguages = data;
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      // Fallback to common languages if API call fails
      this.supportedLanguages = [
        { name: 'python', version: '3.10.0', aliases: ['py', 'python3'] },
        { name: 'java', version: '15.0.2', aliases: ['java'] },
        { name: 'javascript', version: '18.15.0', aliases: ['js', 'node'] },
        { name: 'c', version: '10.2.1', aliases: ['c'] },
        { name: 'cpp', version: '10.2.1', aliases: ['cpp', 'c++'] },
      ];
    }
  }

  /**
   * Get all supported languages from Piston API
   */
  async getSupportedLanguages(): Promise<PistonLanguage[]> {
    if (this.supportedLanguages.length === 0) {
      await this.initializeLanguages();
    }
    return this.supportedLanguages;
  }

  /**
   * Execute code using Piston API
   */
  async executeCode(
    language: string,
    sourceCode: string,
    stdin: string = '',
    options: {
      timeout?: number;
      memoryLimit?: number;
      customArgs?: string[];
    } = {}
  ): Promise<PistonResponse> {
    const { timeout = 5000, memoryLimit = 128000000, customArgs = [] } = options;

    const langConfig = this.languageMap[language.toLowerCase()];
    if (!langConfig) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const requestBody: PistonRequest = {
      language: langConfig.name,
      version: langConfig.version,
      files: [
        {
          name: this.getFileName(language),
          content: sourceCode,
        },
      ],
      stdin: stdin,
      args: customArgs,
      compile_timeout: 10000,
      run_timeout: timeout,
      compile_memory_limit: memoryLimit,
      run_memory_limit: memoryLimit,
    };

    try {
      const response = await fetch(`${this.baseURL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Piston API error: ${response.status} ${response.statusText}`);
      }

      const result: PistonResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Piston API execution error:', error);
      throw new Error(`Failed to execute code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run multiple test cases for a given code
   */
  async runTestCases(
    language: string,
    sourceCode: string,
    testCases: TestCase[],
    options: {
      timeout?: number;
      memoryLimit?: number;
      concurrency?: number;
    } = {}
  ): Promise<ExecutionResult[]> {
    const { concurrency = 3 } = options;
    const results: ExecutionResult[] = [];

    // Process test cases in batches to avoid overwhelming the API
    for (let i = 0; i < testCases.length; i += concurrency) {
      const batch = testCases.slice(i, i + concurrency);

      const batchPromises = batch.map(async (testCase) => {
        const startTime = Date.now();

        try {
          const response = await this.executeCode(language, sourceCode, testCase.input, options);
          const executionTime = Date.now() - startTime;

          const passed = this.compareOutput(response.run.stdout, testCase.expectedOutput);

          return {
            testCase,
            output: response.run.stdout,
            error: response.run.stderr || response.compile?.stderr || '',
            exitCode: response.run.code,
            executionTime,
            memoryUsage: 0, // Piston doesn't provide memory usage
            passed,
          };
        } catch (error) {
          const executionTime = Date.now() - startTime;

          return {
            testCase,
            output: '',
            error: error instanceof Error ? error.message : 'Unknown error',
            exitCode: -1,
            executionTime,
            memoryUsage: 0,
            passed: false,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get file extension for a given language
   */
  private getFileName(language: string): string {
    const extensions: Record<string, string> = {
      python: 'main.py',
      java: 'Main.java',
      c: 'main.c',
      cpp: 'main.cpp',
      javascript: 'main.js',
      go: 'main.go',
      rust: 'main.rs',
      php: 'main.php',
      ruby: 'main.rb',
      typescript: 'main.ts',
    };

    return extensions[language.toLowerCase()] || 'main.txt';
  }

  /**
   * Compare actual output with expected output
   */
  private compareOutput(actual: string, expected: string): boolean {
    // Normalize both outputs for comparison
    const normalizeOutput = (output: string): string => {
      return output
        .trim()
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\s+$/g, '') // Remove trailing whitespace
        .toLowerCase();
    };

    return normalizeOutput(actual) === normalizeOutput(expected);
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return language.toLowerCase() in this.languageMap;
  }

  /**
   * Get language configuration
   */
  getLanguageConfig(language: string): { name: string; version: string } | null {
    return this.languageMap[language.toLowerCase()] || null;
  }

  /**
   * Format execution results for display
   */
  formatExecutionResult(result: PistonResponse): {
    output: string;
    error: string;
    exitCode: number;
    success: boolean;
    compilationError?: string;
  } {
    const output = result.run.stdout || '';
    const error = result.run.stderr || '';
    const exitCode = result.run.code;
    const compilationError = result.compile?.stderr;
    const success = exitCode === 0 && !compilationError;

    return {
      output,
      error,
      exitCode,
      success,
      compilationError,
    };
  }

  /**
   * Health check for Piston API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/runtimes`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const pistonService = new PistonService();
export default pistonService;