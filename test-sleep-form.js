
const { spawn } = require('child_process');
const fs = require('fs');


if (!fs.existsSync('./src/app/components/sleep-form/sleep-form.component.spec.ts')) {
  console.error('Тестовый файл не найден!');
  process.exit(1);
}

console.log('Запуск тестов SleepFormComponent...');


const jestProcess = spawn('npx', ['jest', 'sleep-form.component.spec.ts'], {
  stdio: 'inherit',
  shell: true
});

jestProcess.on('close', (code) => {
  console.log(`Тесты завершены с кодом: ${code}`);
  process.exit(code);
});
