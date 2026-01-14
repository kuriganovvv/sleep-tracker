const ts = require('typescript');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

console.log('Запуск тестов Sleep Tracker...\n');

// Компилятор TypeScript
const compilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true,
  forceConsistentCasingInFileNames: true,
  experimentalDecorators: true,
  emitDecoratorMetadata: true
};

// Функция для компиляции TypeScript
function compileTypeScript(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(content, {
    compilerOptions: compilerOptions
  });
  return result.outputText;
}

// Запуск теста
async function runTest(testFile) {
  try {
    console.log(`📋 Тест: ${path.basename(testFile)}`);
    
    // Компилируем и выполняем
    const jsCode = compileTypeScript(testFile);
    const context = {
      describe: (name, fn) => {
        console.log(`\n📁 Suite: ${name}`);
        fn();
      },
      it: (name, fn) => {
        try {
          fn();
          console.log(`  ✅ ${name}`);
        } catch (error) {
          console.log(`  ❌ ${name}`);
          console.log(`     Ошибка: ${error.message}`);
        }
      },
      beforeEach: (fn) => fn(),
      afterEach: (fn) => fn(),
      expect: (actual) => ({
        toBeTruthy: () => {
          if (!actual) throw new Error('Expected truthy value');
        },
        toBeFalsy: () => {
          if (actual) throw new Error('Expected falsy value');
        },
        toBe: (expected) => {
          if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
        }
      })
    };
    
    vm.createContext(context);
    vm.runInContext(jsCode, context);
    
  } catch (error) {
    console.error(`❌ Ошибка запуска теста: ${error.message}`);
  }
}

// Запускаем тесты
const testFiles = [
  'src/app/components/sleep-form/sleep-form.component.spec.ts',
  'src/app/services/sleep.service.spec.ts',
  'src/app/app.spec.ts'
];

testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    runTest(file);
  } else {
    console.log(`⚠️ Файл не найден: ${file}`);
  }
});
